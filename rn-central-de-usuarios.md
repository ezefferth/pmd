# 📋 Regras de Negócio — Central de Usuários de Dourados (CUD)
**Prefeitura Municipal de Dourados/MS**
Versão: 1.4.0 | Stack: **monorepo** — `auth-api` (NestJS · Fastify) + `admin-web` (Next.js App Router) · Prisma ORM · PostgreSQL (Supabase Self-Hosted) · Redis · Supabase Auth (GoTrue)

> **Papel:** o CUD é o **provedor de identidade (IdP)** e o **repositório central de usuários municipais**.
> É o ponto único de verdade: todo sistema do município (a começar pelo SPD) consulta o CUD para saber
> *quem é o usuário* e *quais acessos ele tem* em cada sistema.
>
> **Duas partes:** `auth-api` (backend NestJS — domínio, contrato de integração) e `admin-web`
> (painel Next.js — o **gerenciador de usuários** da prefeitura). A interface consome a API; nunca
> acessa o banco diretamente (UI → API → domínio).
>
> **Identidade unificada (decidido):** a central de usuários é **única**. Todos — inclusive cidadãos —
> autoregistram a conta **no CUD** e nascem `EXTERNO`; servidores recebem **vínculo interno** e
> **ficha funcional** (seção 11). O SPD **não cria** contas de cidadão: consome a identidade do CUD,
> e com a conta criada o cidadão acessa o SPD para abrir processos (issue #1).
>
> **Convenção:** nomenclatura pt-BR obrigatória (ver `CLAUDE.md` raiz). As permissões no formato
> `MODULO:ACAO` (ex.: `PROCESSOS:CRIAR`) são o **contrato de integração** consumido pelos sistemas —
> definidas em pt-BR, sem camada de tradução.

---

## 1. USUÁRIOS MUNICIPAIS

### 1.1 Cadastro e Identidade

- O usuário municipal é representado por `Usuario` (campos: `id`, `nome`, `cpf`, `email`, `matricula`, `telefone?`, `authId`, `status`, `ehAdminGlobal`, `ativo`, `criadoEm`, `atualizadoEm`).

- **RN-CUD-001:** O `cpf` e o `email` são **únicos** no sistema. O `cpf` é validado por dígito verificador antes da gravação.

- **RN-CUD-002:** O `authId` armazena o identificador do usuário no **Supabase Auth** (o `id` do GoTrue, que é o `sub` do JWT). É a **chave de mapeamento** usada pelos sistemas externos para reconhecer o servidor (ex.: no SPD, o servidor é localizado por este `authId`).

- **RN-CUD-003 (ordem de criação):** Ao criar um usuário, o registro no **Supabase Auth é criado primeiro**. Só após obter o `authId` o usuário é gravado em `Usuario`. Se a gravação no banco falhar, o usuário do Supabase Auth deve ser removido (rollback total) — não pode haver identidade órfã.

### 1.2 Status e Ciclo de Vida

- Status do usuário (enum `StatusUsuario`):
  | Valor               | Significado                                                        |
  |---------------------|--------------------------------------------------------------------|
  | `PENDENTE_ATIVACAO` | Criado, aguardando primeiro acesso / definição de senha            |
  | `ATIVO`             | Pode autenticar e usar os sistemas conforme seus acessos           |
  | `INATIVO`           | Desligado/afastado; não autentica, mas o histórico é preservado    |
  | `BLOQUEADO`         | Suspenso por segurança ou decisão administrativa                   |

- **RN-CUD-004:** Apenas usuários `ATIVO` autenticam. `INATIVO`/`BLOQUEADO` têm a sessão recusada, mesmo com credenciais corretas.

- **RN-CUD-005:** A desativação (`ativo = false` / `status = INATIVO`) **não exclui** o usuário nem seus acessos — apenas os suspende. Acessos concedidos ficam inativos enquanto o usuário não estiver `ATIVO`.

### 1.3 Senha e Primeiro Acesso

- **RN-CUD-006:** A autenticação (email + senha) e o armazenamento de senha são responsabilidade do **Supabase Auth**. O CUD **nunca** armazena senha em `Usuario`.

- **RN-CUD-007:** No primeiro acesso, o usuário `PENDENTE_ATIVACAO` define a senha por link enviado por e-mail (fluxo do Supabase Auth). Ao concluir, passa a `ATIVO`.

- **RN-CUD-008:** A redefinição de senha é sempre delegada ao Supabase Auth (fluxo de recuperação por e-mail). O CUD apenas registra o evento em auditoria (`REDEFINIR_SENHA`).

### 1.4 Admin Global

- **RN-CUD-009:** Usuário com `ehAdminGlobal = true` administra o **próprio CUD** (cadastra usuários, sistemas, perfis e concede acessos). Isso é distinto de ser admin de um sistema consumidor — admin de sistema é definido por perfil/permissão `*` naquele sistema (RN-CUD-014).

---

## 2. SISTEMAS REGISTRADOS

- Cada sistema do município que consome o CUD é registrado em `Sistema` (campos: `id`, `nome`, `slug`, `urlBase`, `descricao?`, `ativo`, `criadoEm`).

- **RN-CUD-010:** O `slug` é **único** e identifica o sistema nas integrações (ex.: `spd`). Imutável após criação (alterá-lo quebraria as concessões de acesso vinculadas).

- **RN-CUD-011:** Um sistema `ativo = false` não aceita novas concessões de acesso e suas verificações de permissão retornam `temAcesso = false`. Acessos existentes são preservados.

---

## 3. PERFIS E PERMISSÕES

- Cada sistema define seus próprios perfis em `Perfil` (campos: `id`, `sistemaId`, `nome`, `slug`, `descricao?`, `permissoes` (string[]), `ehAdministrativo`, `ativo`).

- **RN-CUD-012:** Um `Perfil` pertence a **exatamente um** `Sistema`. O par `(sistemaId, slug)` é único.

- **RN-CUD-013:** `permissoes` é uma lista de strings no formato `MODULO:ACAO` (pt-BR), conforme o contrato. O conjunto de módulos/ações válidos é **definido por cada sistema consumidor** — o CUD armazena e devolve as strings, sem interpretá-las.

- **RN-CUD-014 (curinga admin):** A permissão `*` em um perfil concede **acesso irrestrito naquele sistema**. Perfis com `*` devem ter `ehAdministrativo = true`.

- **RN-CUD-015:** Não é permitido excluir um perfil que tenha acessos ativos vinculados (`Acesso.ativo = true`). Primeiro revoga-se os acessos ou migra-se para outro perfil.

---

## 4. CONCESSÃO DE ACESSO

- O vínculo entre usuário, sistema e perfil é a `Acesso` (campos: `id`, `usuarioId`, `sistemaId`, `perfilId`, `ativo`, `concedidoPorId`, `dataConcessao`, `dataExpiracao?`, `motivo?`).

- **RN-CUD-016:** Um usuário pode ter acesso a **vários sistemas**, e em cada sistema possui **um perfil**. O par `(usuarioId, sistemaId)` ativo é único — trocar de perfil é atualizar o `perfilId`, não criar outro acesso.

- **RN-CUD-017:** A concessão registra **quem concedeu** (`concedidoPorId`) e a data. Toda concessão e revogação gera auditoria (`CONCEDER_ACESSO` / `REVOGAR_ACESSO`).

- **RN-CUD-018:** A revogação é lógica (`ativo = false`), preservando histórico. Acesso com `dataExpiracao` no passado é tratado como inativo automaticamente.

- **RN-CUD-019:** O `perfilId` de um acesso deve pertencer ao **mesmo `sistemaId`** do acesso. O sistema impede vincular um perfil de outro sistema.

---

## 5. VERIFICAÇÃO DE PERMISSÕES (contrato de integração)

Endpoint consumido pelos sistemas para checar permissão granular:

```http
GET /api/v1/acessos/verificar
  ?usuarioId={authId}          # id do Supabase Auth (sub do JWT)
  &sistemaId={slug ou id}
  &permissao={MODULO:ACAO}     # ex.: PROCESSOS:CRIAR

Resposta: { temAcesso: boolean, perfil: string, permissoes: string[] }
```

- **RN-CUD-020:** `temAcesso = true` quando o usuário está `ATIVO`, o sistema está `ativo`, existe `Acesso` ativo e não expirado, e o perfil contém a `permissao` solicitada **ou** o curinga `*`.

- **RN-CUD-021 (cache):** A resposta pode ser cacheada (Redis) com **TTL curto** (ex.: 30–60s) por `(usuarioId, sistemaId)`. Conceder/revogar acesso **invalida** o cache correspondente para refletir a mudança rapidamente.

- **RN-CUD-022:** A verificação **nunca** retorna erro 500 para "sem acesso" — ausência de acesso é `temAcesso = false` com `200`. Erros 5xx são reservados a falhas reais de infraestrutura.

---

## 6. AUTENTICAÇÃO

- **RN-CUD-023:** A autenticação é feita pelo **Supabase Auth** (GoTrue) — email + senha, retornando JWT **HS256** (`access_token`). O CUD valida o JWT e correlaciona o `sub` com `Usuario.authId`.

- **RN-CUD-024:** Endpoints administrativos do CUD exigem JWT válido **e** `ehAdminGlobal = true` (ou permissão específica, quando houver perfil interno do próprio CUD).

- **RN-CUD-025:** O `user_metadata` do Supabase Auth espelha dados não sensíveis do usuário (`nome`, `cpf`, `matricula`) para conveniência dos sistemas; a **fonte de verdade** é sempre a tabela `Usuario`.

---

## 7. AUDITORIA

- Toda ação relevante é registrada em `LogAuditoria` (campos: `id`, `atorId`, `acao`, `entidade`, `entidadeId`, `valorAnterior?`, `valorNovo?`, `enderecoIp`, `userAgent`, `criadoEm`).

- Ações (enum `AcaoAuditoria`): `CRIAR`, `ATUALIZAR`, `EXCLUIR`, `CONCEDER_ACESSO`, `REVOGAR_ACESSO`, `LOGIN`, `LOGOUT`, `REDEFINIR_SENHA`, `BLOQUEAR_USUARIO`, `ATIVAR_USUARIO`, `NOMEAR_ADMIN_SETOR`, `REMOVER_ADMIN_SETOR`, `MUDAR_VINCULO`, `SINCRONIZAR_FICHA`.

- **RN-CUD-026:** `CREATE`/`UPDATE`/`DELETE` em `Usuario`, `Sistema`, `Perfil` e `Acesso` geram registro com `valorAnterior` e `valorNovo` em JSON.

- **RN-CUD-027:** O log é **imutável** — nenhum usuário (inclusive admin global) altera ou exclui registros de `LogAuditoria`.

- **RN-CUD-028:** O log registra `enderecoIp` e `userAgent` da requisição e a identificação do ator (`atorId` = `Usuario.id`).

- **RN-CUD-058 (log abrangente):** O CUD registra **todas** as operações relevantes — autenticação (`LOGIN`/`LOGOUT`), CRUD, concessões/revogações de acesso, mudanças de vínculo, sincronização de ficha e nomeações de admin. **Nenhuma mutação de estado ocorre sem rastro** em `LogAuditoria`.

---

## 8. CONTRATO DE PROVISIONAMENTO (API administrativa)

Endpoints usados para registrar sistemas, perfis e usuários:

```http
POST /api/v1/sistemas                 # registra um sistema (ex.: SPD)
POST /api/v1/sistemas/{id}/perfis     # cria perfil do sistema
POST /api/v1/usuarios                 # cria usuário municipal (cria também no Supabase Auth)
POST /api/v1/acessos                  # concede acesso (usuario × sistema × perfil)
GET  /api/v1/acessos/verificar        # verificação de permissão (seção 5)
```

### Exemplo — registro do SPD e perfis (permissões pt-BR)

```
Sistema:
  nome: "Sistema de Protocolo Digital"
  slug: "spd"
  urlBase: "http://localhost:3001"

Perfis do SPD:
  admin-spd     → ["*"]                                                            (ehAdministrativo = true)
  gestor-spd    → ["PROCESSOS:APROVAR","PROCESSOS:TRANSFERIR","PROCESSOS:CONCLUIR","USUARIOS:LER"]
  analista-spd  → ["PROCESSOS:CRIAR","PROCESSOS:ATUALIZAR","MOVIMENTACOES:CRIAR","DOCUMENTOS:CRIAR"]
  servidor-spd  → ["PROCESSOS:LER","MOVIMENTACOES:LER","DOCUMENTOS:LER"]
  consulta-spd  → ["PROCESSOS:LER"]
```

---

## 9. INTERFACE DE GESTÃO (admin-web)

O `admin-web` (Next.js App Router) é o **gerenciador de usuários** da prefeitura — o front administrativo do IdP. Consome a `auth-api`; segue a skill global `software-architecture` com nomenclatura **pt-BR**.

### 9.1 Acesso ao painel

- **RN-CUD-029:** O acesso ao painel é restrito a usuários com `ehAdminGlobal = true` (ou perfil interno do próprio CUD, quando houver). Login via Supabase Auth (RN-CUD-023), sessão em cookie httpOnly.

- **RN-CUD-030:** Toda ação do painel passa pela `auth-api`. O `admin-web` **não acessa o banco diretamente** — mantém a separação UI → API → domínio.

### 9.2 Telas e Funcionalidades

| Tela            | Funcionalidades                                                                                          |
|-----------------|---------------------------------------------------------------------------------------------------------|
| **Dashboard**   | Métricas: total de usuários, ativos/inativos/bloqueados, acessos por sistema, últimas ações de auditoria |
| **Usuários**    | Listar (busca por nome/CPF/email, filtro por status, paginação), criar, editar, ativar/inativar/bloquear, reenviar ativação, redefinir senha |
| **Sistemas**    | Listar, registrar, editar, ativar/desativar                                                             |
| **Perfis**      | Por sistema: listar, criar, editar `permissoes` (`MODULO:ACAO`), ativar/desativar                       |
| **Acessos**     | Conceder/revogar (usuário × sistema × perfil), ver acessos de um usuário, definir expiração             |
| **Auditoria**   | Listar logs com filtros (ator, ação, entidade, período) — somente leitura                               |
| **Configurações**| Parâmetros do CUD (sessão, cache, integrações)                                                          |

### 9.3 Regras da Interface

- **RN-CUD-031:** Toda listagem é **paginada e filtrável**, retornando o padrão `ResultadoPaginado` (pt-BR) da API.

- **RN-CUD-032:** O formulário de criação de usuário valida CPF/email com Zod no cliente; a `auth-api` **revalida** no servidor e segue a ordem Supabase Auth → banco (RN-CUD-003). Erros do Betha/Supabase são exibidos de forma clara, sem vazar detalhes sensíveis.

- **RN-CUD-033:** A tela de Acessos só lista perfis do **sistema selecionado** e impede vincular perfil de outro sistema (RN-CUD-019).

- **RN-CUD-034:** Ações sensíveis — bloquear usuário, revogar acesso, redefinir senha — exigem **confirmação explícita** e geram registro em `LogAuditoria`.

- **RN-CUD-035 (opcional):** Importação em massa de servidores via CSV, criando usuários em lote (cada linha segue RN-CUD-003), com relatório de erros por linha.

### 9.4 Mini-perfil do usuário

- **RN-CUD-056:** A tela de detalhe do usuário (mini-perfil) lista **todos os sistemas e módulos** a que o servidor tem acesso — derivados dos `Acesso` ativos × `Perfil` × `permissoes` (`MODULO:ACAO`) — com **busca/filtro** por sistema ou módulo.

- **RN-CUD-057:** O mini-perfil exibe também o **histórico de atividades** do usuário (registros de `LogAuditoria` em que ele é ator), com filtro por período e ação — somente leitura.

---

## 10. ADMINISTRAÇÃO HIERÁRQUICA POR SETOR

Além do **admin global** (RN-CUD-009), o CUD suporta **administração delegada por setor**: cada setor pode ter um (ou mais) administrador, que cuida do próprio setor **e de todos os setores abaixo dele**, recursivamente. Para isso, o CUD mantém a hierarquia organizacional do município.

> **Nota de arquitetura (decidido):** a hierarquia de setores é **canônica no CUD** — é onde se define oficialmente em qual setor o usuário é servidor (lotação oficial). Futuramente esses setores serão **puxados do sistema de RH** (a ser criado) para o CUD. O SPD pode **manter seu próprio `Organograma`** para roteamento de processos, **mesmo que a árvore fique duplicada**; a lotação oficial do servidor é sempre a do CUD.

### 10.1 Hierarquia de Setores

- `Setor` (campos: `id`, `nome`, `sigla`, `paiId?` (auto-referência), `ativo`, `criadoEm`).
- `Usuario.setorId` — **lotação** do usuário (setor onde está alocado).

- **RN-CUD-036:** `Setor` é uma **árvore** via `paiId`. Um setor raiz tem `paiId = null`. Os **descendentes** de um setor são toda a subárvore abaixo dele (filhos, netos, …).

- **RN-CUD-037:** Todo usuário possui uma lotação (`setorId`). A lotação define a que escopo administrativo ele pertence.

### 10.2 Administrador de Setor

- `AdministradorSetor` (campos: `id`, `setorId`, `usuarioId`, `ativo`, `nomeadoPorId`, `dataNomeacao`).

- **RN-CUD-038:** Um setor pode ter **zero ou mais** administradores. O administrador de um setor administra **esse setor e todos os seus descendentes** (subárvore), recursivamente — "e assim sucessivamente".

- **RN-CUD-039 (escopo efetivo):** O escopo de um administrador é a **união das subárvores** dos setores que ele administra. Ele só **enxerga e gerencia** usuários lotados dentro do seu escopo. "Pode gerenciar X" ⇔ X está lotado em algum setor do escopo.

### 10.3 Poderes e Limites

- **RN-CUD-040:** Dentro do escopo, o admin de setor pode **gerenciar usuários** (criar, editar, ativar/inativar/bloquear, redefinir senha) e **conceder/revogar acessos** a sistemas para esses usuários.

- **RN-CUD-041 (delegação recursiva):** O admin pode **nomear administradores** para setores do seu escopo (descendentes). **Não pode** nomear nem alterar administradores em setores **acima** ou **fora** do seu escopo.

- **RN-CUD-042 (não-escalonamento de privilégio):** Um admin de setor **não pode** conceder perfil/acesso com privilégio maior do que ele próprio possui, nem promover alguém a admin global. Apenas o **admin global** cria outros admins globais e atua fora de qualquer setor.

- **RN-CUD-043 (topo da hierarquia):** `ehAdminGlobal = true` administra **todos** os setores e usuários, independentemente da árvore.

### 10.4 Reflexo no Painel e Auditoria

- **RN-CUD-044:** O `admin-web` **filtra** usuários, setores e acessos pelo **escopo do administrador logado** (o admin global vê tudo). Dados fora do escopo não são listados nem acessíveis.

- **RN-CUD-045:** Nomeação e remoção de administrador de setor geram `LogAuditoria` (ações `NOMEAR_ADMIN_SETOR` / `REMOVER_ADMIN_SETOR`), registrando o **setor de origem** do privilégio utilizado.

---

## 11. TIPO DE VÍNCULO E FICHA FUNCIONAL

Todo usuário se autoregistra e nasce **externo**. Para se tornar servidor (ou outro vínculo interno) é preciso **vinculá-lo** a um tipo no sistema. O vínculo interno é **pré-requisito** para acessos internos, mas **não concede acesso** por si só.

### 11.1 Tipo de Vínculo

- `Usuario.tipoVinculo` (enum `TipoVinculo`), padrão `EXTERNO`:
  | Valor          | Descrição                                                          |
  |----------------|--------------------------------------------------------------------|
  | `EXTERNO`      | Público em geral / cidadão / empresa — conta autoregistrada        |
  | `EFETIVO`      | Servidor de cargo efetivo (concursado)                            |
  | `COMISSIONADO` | Cargo em comissão (livre nomeação)                                |
  | `ESTAGIARIO`   | Estagiário                                                         |
  | `ELETIVO`      | Agente político eleito (prefeito, vice, vereadores)               |
  | `TEMPORARIO`   | Contratação por tempo determinado (paridade com o RH)             |

- Derivado: `ehInterno = tipoVinculo != EXTERNO`.

- **RN-CUD-046:** Todo usuário se **autoregistra** e nasce `EXTERNO`. A conta externa exige CPF, nome e e-mail + verificação (RN-CUD-007).

- **RN-CUD-047:** Tornar-se interno exige **vínculo explícito**, atribuído por admin competente (admin global ou admin de setor no escopo, RN-CUD-040) **ou** pela sincronização do RH. O usuário **não** escolhe o próprio tipo.

- **RN-CUD-048:** O vínculo interno **por si só não concede acesso** a sistemas/módulos — o acesso permanece via concessão (`Acesso`, seção 4). Vínculo é pré-requisito, não permissão.

### 11.2 Acesso por Tipo de Vínculo

- `Perfil.permiteExterno` (boolean, padrão `false`) — marca perfis liberados a externos.

- **RN-CUD-049:** Usuário `EXTERNO` só pode receber acesso a perfis com `permiteExterno = true` — ex.: protocolo/abertura de processos no SPD e **consultas** públicas. Perfis de módulos internos (gestão etc.) têm `permiteExterno = false` e são **vedados** a externos.

- **RN-CUD-050:** A verificação de permissão (seção 5) retorna `temAcesso = false` quando o usuário é `EXTERNO` e o perfil concedido **não** tem `permiteExterno = true` — defesa em profundidade, mesmo diante de concessão indevida.

- **RN-CUD-051:** Rebaixar um usuário para `EXTERNO` (ex.: exoneração) **revoga automaticamente** os acessos a perfis com `permiteExterno = false`.

### 11.3 Ficha Funcional (servidor)

- `FichaFuncional` (1:1 com `Usuario`, **somente internos**): `usuarioId`, `matricula`, `cargo`, `setorLotacaoId` (→ `Setor`), `regimeJuridico`, `situacaoFuncional`, `dataAdmissao`, `dataExoneracao?`, `rhId`, `atualizadoEm`.

- Situação (enum `SituacaoFuncional`, espelho do RH): `ATIVO`, `FERIAS`, `AFASTADO`, `LICENCA`, `CEDIDO`, `VACANCIA`, `EXONERADO`, `APOSENTADO`.

- **RN-CUD-052:** A ficha existe **somente** para internos (`ehInterno = true`); externos não possuem ficha.

- **RN-CUD-053 (origem RH):** A ficha é **provida e mantida pelo sistema de RH** (integração externa). O **dado-mestre funcional é o RH**; o CUD armazena e sincroniza pela chave `rhId`.

- **RN-CUD-054:** A sincronização do RH pode definir/atualizar `tipoVinculo`, a lotação (`setorLotacaoId`, que reflete em `Usuario.setorId` — seção 10) e `situacaoFuncional`. `EXONERADO`/`APOSENTADO` **aciona o rebaixamento** da RN-CUD-051 (rebaixa para `EXTERNO` e revoga acessos internos).

- **RN-CUD-055:** O `admin-web` **exibe** a ficha funcional; edição direta é restrita (preferir o fluxo do RH). Acesso e alterações da ficha seguem auditoria (seção 7).

### 11.4 Status de Conta × Situação Funcional

- **RN-CUD-059:** O usuário possui **dois indicadores distintos**:
  - `status` de conta (`StatusUsuario`: `PENDENTE_ATIVACAO`/`ATIVO`/`INATIVO`/`BLOQUEADO`) — controla o **login**.
  - `situacaoFuncional` (servidor) — **sincronizada do RH**, refletindo se o servidor está ativo ou inativo (`FERIAS`, `AFASTADO`, `LICENCA`, `VACANCIA`, etc.). Externos não possuem situação funcional.
  Na criação/manutenção do usuário, a situação funcional é definida pela ficha (origem RH, RN-CUD-053).

- **RN-CUD-060:** Servidor em `FERIAS`/`AFASTADO`/`LICENCA`/`VACANCIA` é **funcionalmente inativo** (`estaFuncionalmenteAtivo = false`): mantém a conta, mas os sistemas consumidores (ex.: SPD) o tratam como **indisponível para novas atribuições/atuação**. `EXONERADO`/`APOSENTADO` aciona o rebaixamento para `EXTERNO` (RN-CUD-054). A mudança de situação funcional é propagada aos sistemas em tempo hábil.

---

## 12. SEEDS INICIAIS RECOMENDADAS

```
Usuario admin global:
  nome:  "Administrador CUD"
  email: admin@dourados.ms.gov.br
  ehAdminGlobal: true
  status: ATIVO

Sistema inicial:
  slug: "spd"  (Sistema de Protocolo Digital)

Perfis do SPD: admin-spd, gestor-spd, analista-spd, servidor-spd, consulta-spd (seção 8)

ConfiguracaoSistema (CUD):
  - TEMPO_EXPIRACAO_SESSAO_MIN = 60
  - TTL_CACHE_VERIFICACAO_SEG  = 45
  - SUPABASE_AUTH_URL = <url>
  - JWT_SECRET = <segredo HS256>   (via process.env, nunca no código)
```

---

## Apêndice — Mapeamento de entidades CUD ↔ SPD ↔ Supabase Auth

| CUD (`Usuario`)   | SPD (servidor)        | Supabase Auth          |
|-------------------|-----------------------|------------------------|
| `Usuario.id`      | referência local      | —                      |
| `Usuario.authId`  | chave de correlação   | `id` (sub do JWT)      |
| `Usuario.email`   | `email`               | `email`                |
| `Usuario.nome`    | `nome`                | `user_metadata.nome`   |
| `Usuario.cpf`     | `cpf`                 | `user_metadata.cpf`    |
| `Usuario.matricula`| `matricula`          | `user_metadata.matricula` |
| `Perfil`          | perfil/role local     | —                      |
| `permissoes[]`    | `MODULO:ACAO`         | —                      |
| `Setor`           | mapeia p/ `Organograma` (a definir) | —                      |
| `Usuario.setorId` | lotação do servidor   | —                      |

### Entidades de administração hierárquica (v1.2)
`Setor` (árvore via `paiId`), `AdministradorSetor` (setor × usuário admin), `Usuario.setorId` (lotação).

### Entidades / campos de vínculo e ficha (v1.3)
`FichaFuncional` (1:1 com `Usuario`, só internos), `Usuario.tipoVinculo`, `Perfil.permiteExterno`.

### Enums do CUD
| Enum               | Valores                                                                                          |
|--------------------|-------------------------------------------------------------------------------------------------|
| `StatusUsuario`    | PENDENTE_ATIVACAO, ATIVO, INATIVO, BLOQUEADO                                                     |
| `TipoVinculo`      | EXTERNO, EFETIVO, COMISSIONADO, ESTAGIARIO, ELETIVO, TEMPORARIO                                  |
| `SituacaoFuncional`| ATIVO, FERIAS, AFASTADO, LICENCA, CEDIDO, VACANCIA, EXONERADO, APOSENTADO                        |
| `AcaoAuditoria`    | CRIAR, ATUALIZAR, EXCLUIR, CONCEDER_ACESSO, REVOGAR_ACESSO, LOGIN, LOGOUT, REDEFINIR_SENHA, BLOQUEAR_USUARIO, ATIVAR_USUARIO, NOMEAR_ADMIN_SETOR, REMOVER_ADMIN_SETOR, MUDAR_VINCULO, SINCRONIZAR_FICHA |

> **Decidido (v1.3):** a central é **única**. Externos (incl. cidadãos/empresas) existem **no CUD** como `tipoVinculo = EXTERNO`, autoregistrados. O SPD **não tem mais** entidade `Citizen` — autentica o cidadão via CUD (issue #1). Servidores ganham vínculo interno + ficha funcional (seção 11).

---

*Documento base para a reconstrução do CUD — Prefeitura Municipal de Dourados/MS.*
