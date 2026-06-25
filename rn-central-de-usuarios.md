# 📋 Regras de Negócio — Central de Usuários de Dourados (CUD)
**Prefeitura Municipal de Dourados/MS**
Versão: 1.0.0 | Stack: NestJS · Fastify · Prisma ORM · PostgreSQL (Supabase Self-Hosted) · Redis · Supabase Auth (GoTrue)

> **Papel:** o CUD é o **provedor de identidade (IdP)** e o **repositório central de usuários municipais**.
> É o ponto único de verdade: todo sistema do município (a começar pelo SPD) consulta o CUD para saber
> *quem é o usuário* e *quais acessos ele tem* em cada sistema.
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

- Ações (enum `AcaoAuditoria`): `CRIAR`, `ATUALIZAR`, `EXCLUIR`, `CONCEDER_ACESSO`, `REVOGAR_ACESSO`, `LOGIN`, `LOGOUT`, `REDEFINIR_SENHA`, `BLOQUEAR_USUARIO`, `ATIVAR_USUARIO`.

- **RN-CUD-026:** `CREATE`/`UPDATE`/`DELETE` em `Usuario`, `Sistema`, `Perfil` e `Acesso` geram registro com `valorAnterior` e `valorNovo` em JSON.

- **RN-CUD-027:** O log é **imutável** — nenhum usuário (inclusive admin global) altera ou exclui registros de `LogAuditoria`.

- **RN-CUD-028:** O log registra `enderecoIp` e `userAgent` da requisição e a identificação do ator (`atorId` = `Usuario.id`).

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

## 9. SEEDS INICIAIS RECOMENDADAS

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

### Enums do CUD
| Enum            | Valores                                                                                          |
|-----------------|-------------------------------------------------------------------------------------------------|
| `StatusUsuario` | PENDENTE_ATIVACAO, ATIVO, INATIVO, BLOQUEADO                                                     |
| `AcaoAuditoria` | CRIAR, ATUALIZAR, EXCLUIR, CONCEDER_ACESSO, REVOGAR_ACESSO, LOGIN, LOGOUT, REDEFINIR_SENHA, BLOQUEAR_USUARIO, ATIVAR_USUARIO |

> Cidadãos **não** são usuários municipais e **não** existem no CUD — permanecem com autenticação própria (CPF) no portal do SPD.

---

*Documento base para a reconstrução do CUD — Prefeitura Municipal de Dourados/MS.*
