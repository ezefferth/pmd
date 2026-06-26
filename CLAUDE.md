# PMD — Suíte de Sistemas da Prefeitura Municipal de Dourados/MS

Workspace raiz que agrupa três sistemas municipais interdependentes (em `sistemas/`): **CUD** (central de usuários), **SPD** (protocolo) e **RH** (recursos humanos).
Trabalhe sempre dentro do subprojeto correto; este arquivo fornece o contexto de integração entre eles.

> **Estado atual e ponto de retomada:** ver [`progresso.md`](progresso.md). Detalhes de regra de negócio
> nas RN (`rn-central-de-usuarios.md`, `rn-protocolo.md`, `rn-recursos-humanos.md`).

---

## Convenção de código — obrigatória em todo o ecossistema PMD

### Nomenclatura em português (pt-BR)
Todo código novo **deve** usar pt-BR em funções, variáveis, parâmetros, constantes e tipos.
Exceções: nomes impostos por frameworks (decorators NestJS, hooks React, palavras-chave Prisma) permanecem em inglês.

| Categoria | Padrão | Exemplos |
|-----------|--------|---------|
| Funções / métodos | camelCase pt-BR | `buscarPorId`, `criarProcesso`, `listarAcessos`, `redefinirSenha` |
| Variáveis | camelCase pt-BR | `usuario`, `totalPaginas`, `dadosPaginados`, `listaErros` |
| Parâmetros | camelCase pt-BR | `pagina`, `limite`, `busca`, `operadorId` |
| Booleanos | prefixo `esta/pode/tem/eh` | `estaAtivo`, `podeEditar`, `temAcesso`, `ehAdmin` |
| Constantes | SCREAMING_SNAKE pt-BR | `TEMPO_EXPIRACAO_SESSAO`, `TAMANHO_MAXIMO_ARQUIVO` |
| Tipos / Interfaces de saída | PascalCase pt-BR | `UsuarioResumo`, `UsuarioDetalhe`, `ResultadoPaginado`, `VerificarAcessoResposta` |
| DTOs de entrada (NestJS) | PascalCase pt-BR + sufixo `Dto` | `CriarUsuarioDto`, `AtualizarSistemaDto`, `ConcederAcessoDto` |
| Enums | PascalCase pt-BR; membros SCREAMING_SNAKE | `StatusProcesso`, `AcaoAuditoria`, `TipoAtribuicao` |
| Rotas URL | kebab-case pt-BR | `/usuarios`, `/meus-processos`, `/redefinir-senha` |

> `Dto` é convenção do NestJS (framework) — permanece em inglês. Tipos de resposta e interfaces genéricas usam pt-BR puro (`Resposta`, `Resumo`, `Detalhe`).

```ts
// correto
async function buscarUsuarioPorEmail(email: string): Promise<UsuarioDetalhe | null> {
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  const estaAtivo = usuario?.ativo ?? false
  return estaAtivo ? usuario : null
}

// errado — variáveis e função em inglês
async function findUserByEmail(email: string) {
  const user = await prisma.usuario.findUnique({ where: { email } })
  const isActive = user?.ativo ?? false
  return isActive ? user : null
}
```

### Comentários essenciais
Comente **somente** quando o PORQUÊ não for óbvio pelo código. Nunca descreva o que o código faz.

Casos que exigem comentário:
- Integração entre sistemas: `// sincroniza com Supabase Auth antes de salvar no banco`
- Regra de negócio numerada: `// RN-023: incremento atômico — sem race condition`
- Restrição externa: `// Betha exige bethaId antes de criar lançamento`
- Comportamento contra-intuitivo: `// @Public() aqui porque sistemas externos usam JWT próprio`
- Decisão de arquitetura local: `// cache curto — dado muda com concessão de acesso`

```ts
// correto — explica restrição não óbvia
async function criarUsuario(dto: CriarUsuarioDto) {
  // Supabase Auth precisa existir antes do banco — se falhar aqui, rollback total
  const authId = await this.supabase.criarUsuario(dto)
  return this.prisma.usuario.create({ data: { ...dto, authId } })
}

// errado — descreve o que o código já mostra
// Cria o usuário no Supabase e depois salva no banco
async function criarUsuario(dto: CriarUsuarioDto) { ... }
```

---

## Estrutura do workspace

```
PMD/
├── sistemas/
│   ├── cud/   # Central de Usuários de Dourados — auth + identidade de todos os sistemas
│   ├── spd/   # Sistema de Protocolo Digital — tramitação de processos
│   └── rh/    # Recursos Humanos — dado-mestre funcional (alimenta o CUD)
└── supabase/  # infraestrutura local compartilhada (PostgreSQL + Auth + Storage)
```

> Os subprojetos ficam sob `sistemas/`. Apps atuais: `sistemas/cud/{auth-api,admin-web,conta-web}` e
> `sistemas/rh/api`. Os scripts de dev da raiz (`npm run dev:*`) já apontam para os diretórios certos.

Quando um subprojeto tiver seu próprio `CLAUDE.md`, leia-o antes de editar arquivos dentro dele.

---

## Os três sistemas

### CUD — Central de Usuários de Dourados
**Papel:** provedor de identidade (IdP) e repositório central de **todos** os usuários municipais. Ponto único de verdade — todo sistema consulta o CUD para saber quem é o usuário e quais acessos tem.

- `auth-api` (NestJS/Fastify, :3001) + `admin-web` (Next.js, :3000, gestor) + `conta-web` (Next.js, :3006, autogestão do próprio usuário)
- Supabase Auth (GoTrue) como engine de autenticação — email+senha, JWT HS256
- PostgreSQL (schema `cud`, via Supabase local) + Redis
- **Identidade única:** externos/cidadãos se autoregistram (`tipoVinculo = EXTERNO`); servidores recebem vínculo interno + ficha funcional (sincronizada do RH)
- Expõe `GET /acessos/verificar` para os sistemas checarem permissões granulares

### RH — Recursos Humanos
**Papel:** **dado-mestre funcional** dos servidores (estrutura organizacional, cargos/carreiras, vínculos, lotação, situação). Alimenta o CUD (ficha funcional + árvore de setores). Frequência é escopo futuro.

- `api` (NestJS/Fastify, :3005) + `rh-web` (Next.js, :3004, a criar)
- Prisma + PostgreSQL (schema `rh`)
- **Não autentica nem concede permissões** — isso é do CUD; correlação por **CPF**/`matricula`/`rhId`

### SPD — Sistema de Protocolo Digital
**Papel:** abertura, tramitação e acompanhamento de processos pelo cidadão e servidor.

- App Next.js (App Router) em `sistemas/spd/web/`, :3002 (a criar)
- Prisma + PostgreSQL (schema `spd`, via Supabase local) + Supabase Storage (documentos)
- Integração externa crítica com API Betha (tributário)
- Dois públicos: servidores internos (`(internal)/`) e cidadãos (`(portal)/`) — **ambos autenticam via CUD** (cidadão = conta `EXTERNO` do CUD; não há mais `Citizen` próprio)

---

## Arquitetura de integração

```
RH → publica ficha funcional + árvore de setores → CUD

Cidadão/Servidor → Supabase Auth (CUD) → JWT HS256
                                     ↓
                    auth-api CUD → perfil + permissões granulares
                                     ↓
   SPD consulta GET /acessos/verificar?usuarioId=X&sistemaId=spd&permissao=PROCESSOS:CRIAR
```

**Identidade:** todos (cidadãos e servidores) autenticam via CUD (Supabase Auth). O cidadão é uma conta
`EXTERNO` do CUD; o servidor recebe vínculo interno + ficha funcional vinda do RH.
**Permissões:** o SPD consome o CUD via `GET /acessos/verificar` (contrato `MODULO:ACAO` em pt-BR).

---

## Contrato de integração SPD ↔ CUD

### Registro do SPD no CUD
```
Sistema no banco CUD:
  nome: "Sistema de Protocolo Digital"
  slug: "spd"
  urlBase: "http://localhost:3002"

Perfis mínimos do SPD no CUD (permissões MODULO:ACAO em pt-BR):
  "admin-spd"       → ["*"]
  "gestor-spd"      → ["PROCESSOS:APROVAR","PROCESSOS:TRANSFERIR","PROCESSOS:CONCLUIR","USUARIOS:LER"]
  "analista-spd"    → ["PROCESSOS:CRIAR","PROCESSOS:ATUALIZAR","MOVIMENTACOES:CRIAR","DOCUMENTOS:CRIAR"]
  "servidor-spd"    → ["PROCESSOS:LER","MOVIMENTACOES:LER","DOCUMENTOS:LER"]
  "consulta-spd"    → ["PROCESSOS:LER"]
```

### Como o SPD verifica permissão via CUD
```http
GET http://localhost:3001/api/v1/acessos/verificar
  ?usuarioId={authId}            # id do Supabase Auth (sub do JWT)
  &sistemaId=spd
  &permissao=MODULO:ACAO         # ex.: PROCESSOS:CRIAR

Resposta: { temAcesso: boolean, perfil: string, permissoes: string[] }
```

Chave de mapeamento: `usuarios.authId` no CUD = `sub` do JWT Supabase = identificador do usuário no SPD.

### Fluxo de autenticação no SPD
```
1. Usuário (cidadão ou servidor) acessa /login no SPD
2. SPD valida credenciais contra Supabase Auth (CUD) — email+senha
3. Supabase Auth retorna JWT HS256 (access_token)
4. SPD armazena JWT em cookie httpOnly
5. Para ações sensíveis: SPD chama GET /acessos/verificar com Bearer token
```

---

## Mapeamento de entidades entre sistemas

| SPD | CUD | Supabase Auth |
|-----|-----|---------------|
| referência local | `Usuario.id` | — |
| chave de correlação | `Usuario.authId` | `id` (sub do JWT) |
| email | `Usuario.email` | `email` |
| nome | `Usuario.nome` | `user_metadata.nome` |
| cpf | `Usuario.cpf` | `user_metadata.cpf` |
| matrícula | `Usuario.matricula` | `user_metadata.matricula` |
| perfil local | `Perfil` (CUD) | — |
| `MODULO:ACAO` | `permissoes[]` no `Perfil` | — |

> `authId` armazena o `id` do Supabase Auth (sub do JWT). O SPD **não** tem mais tabela `User`/`Citizen`
> própria — a identidade (cidadão e servidor) é a conta única do CUD.

---

## Roadmap de integração (por fase)

### Fase 0 — Fundação ← estado atual
- [x] CUD: infraestrutura completa, auth-api funcional, admin-web funcional
- [x] SPD: sistema completo com autenticação própria para servidores

### Fase 1 — Registrar SPD no CUD
- [ ] Registrar sistema SPD via `POST /sistemas` na auth-api
- [ ] Criar perfis SPD via `POST /sistemas/{id}/perfis` (5 perfis acima)
- [ ] Criar servidores municipais no CUD via `POST /usuarios` (sincronizar base inicial do SPD)

### Fase 2 — Autenticação via CUD no SPD
- [ ] Login de servidores e **de cidadãos** via Supabase Auth (CUD) — identidade única
- [ ] Validar JWT Supabase nas rotas `(internal)/` e `(portal)/`
- [ ] Descontinuar `Citizen`/`User` próprios; cidadão = conta `EXTERNO` do CUD (issue #1)

### Fase 3 — Verificação de permissões via CUD
- [ ] Criar `src/lib/cud.ts` no SPD — client HTTP para `GET /acessos/verificar`
- [ ] Adaptar `src/lib/permissions.ts` para buscar permissões do CUD (em vez de banco local)
- [ ] Definir estratégia de cache (in-memory com TTL curto) para evitar latência

### Fase 4 — Consolidação
- [ ] Migrar gestão de usuários do SPD para o CUD (CRUD via admin-web do CUD)
- [ ] Remover tabelas `User`, `Profile`, `AccessGroup` do schema SPD (ou manter só para legado)
- [ ] Testes de integração completos

---

## Infraestrutura compartilhada (Supabase local)

PostgreSQL, Auth e Storage são gerenciados por um único Supabase na raiz do PMD.
Cada sistema usa um **schema isolado** dentro do mesmo banco `postgres`.

```
PostgreSQL :54322
├── schema: public     ← Supabase interno
├── schema: cud        ← CUD Prisma
├── schema: spd        ← SPD Prisma
└── schema: rh         ← RH Prisma
```

### Comandos de infra (executar na raiz PMD/)

```bash
npm run infra:up             # supabase start + Redis (docker compose)
npm run db:status            # chaves do Supabase (preencher nos .env)
npm run db:reset             # recria o banco e aplica migrations (schemas cud/spd/rh)
npm run infra:down           # derruba Redis + Supabase
```

### Migrations de tabelas (Prisma — por app)

```bash
# CUD
cd sistemas/cud/auth-api && pnpm prisma:migrate --name init   # tabelas no schema cud
# RH
cd sistemas/rh/api && pnpm prisma:migrate --name init         # tabelas no schema rh
```

---

## Como trabalhar com este workspace

### Quando alterar CUD
- Gestão de usuários, sistemas, perfis ou acessos entre sistemas
- Infraestrutura (Supabase Auth, Redis, schema CUD)
- Logs de auditoria do CUD

```bash
# da raiz PMD/
npm run infra:up         # Supabase + Redis
npm run dev:cud-api      # auth-api :3001
npm run dev:cud-web      # admin-web :3000
# conta-web (autogestão): pnpm -C sistemas/cud/conta-web dev   # :3006
```

### Quando alterar RH
- Estrutura organizacional, cargos/carreiras, servidores, movimentações funcionais
- Sincronização RH→CUD (ficha funcional + setores)

```bash
npm run dev:rh-api       # api :3005
```

### Quando alterar SPD
- Tramitação de processos, assuntos, organograma, documentos · portal do cidadão · integração Betha

```bash
npm run dev:spd          # web :3002 (a criar)
```

### Quando alterar mais de um
Tarefas de integração. Nesse caso:
1. Identifique qual contrato muda (endpoint, payload, mapeamento de entidade)
2. Ajuste o CUD primeiro (produtor do contrato)
3. Ajuste o SPD em seguida (consumidor do contrato)
4. Valide com os dois serviços rodando simultaneamente

---

## Portas em desenvolvimento (com ambos rodando)

| Serviço | Porta |
|---------|-------|
| Supabase Studio | 54323 |
| Supabase API / Auth / Storage | 54321 |
| PostgreSQL direto | 54322 |
| Redis | 6379 |
| CUD admin-web | 3000 |
| CUD auth-api | 3001 |
| SPD web (protocolo) | 3002 |
| SPD api | 3003 (reservado) |
| RH web | 3004 |
| RH api | 3005 |

> Convenção: cada sistema reserva um par (web, API) — a API fica na **porta subsequente** à web.
> Supabase Studio (:54323) visualiza os schemas `cud`/`spd`/`rh` em um único lugar.

---

## Decisões arquiteturais (nível PMD)

**Por que identidade única no CUD (inclusive cidadãos)?**
Decidiu-se unificar: todos — cidadãos e servidores — têm conta no CUD. O cidadão se autoregistra como
`tipoVinculo = EXTERNO` e só acessa o que perfis com `permiteExterno = true` liberam (protocolo + consultas).
Servidores recebem vínculo interno + ficha funcional (do RH). Um só IdP reduz duplicação e simplifica o SSO.
Revê a decisão anterior de manter `Citizen` próprio no SPD (issue #1).

**Por que `permissoes[]` no CUD são strings `MODULO:ACAO` em pt-BR?**
É o contrato de permissão granular consumido pelos sistemas, definido em pt-BR desde a origem — sem camada
de tradução entre CUD e consumidores.

**Por que o RH é o dado-mestre funcional, separado do CUD?**
O CUD é IdP agnóstico de domínio (identidade + acessos). Dados funcionais (cargos, carreiras, lotação,
situação) pertencem ao RH, que os publica para o CUD. Mantém o IdP enxuto e a folha/funcional no sistema certo.

**Por que manter o Betha separado do CUD?**
Betha é integração tributária específica do SPD. O CUD é auth agnóstico de domínio. Misturar acoplaria o IdP a regras de negócio do protocolo.

**Por que Supabase local com schemas ao invés de bancos separados?**
Supabase CLI gerencia um único banco `postgres`. Schemas isolam os dados por sistema sem overhead de múltiplas instâncias. O Studio visualiza todos os schemas em um único lugar, e o Storage local substitui o Supabase cloud para documentos do SPD sem custo adicional.

**Por que Supabase Auth e não um IdP separado (ex-Keycloak)?**
Supabase Auth (GoTrue) é mais leve, sem dependência Java, e integra nativamente com o PostgreSQL que já usamos. Para o volume da prefeitura, JWT HS256 com `app_metadata.roles` é suficiente e mais simples de operar on-premises.
