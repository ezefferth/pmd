# PMD — Suíte de Sistemas da Prefeitura Municipal de Dourados/MS

Monorepo que agrupa os sistemas municipais interdependentes de Dourados/MS.

## Sistemas

Os subprojetos ficam em [`sistemas/`](sistemas/).

| Sistema | Pasta | Papel |
|---------|-------|-------|
| **CUD** — Central de Usuários de Dourados | `sistemas/cud/` | Provedor de identidade (IdP) e repositório central de usuários municipais |
| **SPD** — Sistema de Protocolo Digital | `sistemas/spd/` | Abertura, tramitação e acompanhamento de processos |
| **RH** — Recursos Humanos | `sistemas/rh/` | Dado-mestre funcional (cargos, vínculos, lotação); alimenta o CUD. Frequência (futuro) |

> Infraestrutura compartilhada via Supabase local: **um único PostgreSQL** com schemas isolados `cud`, `spd` e `rh` (+ Auth e Storage). A comunicação entre sistemas é por **API HTTP**, não por acesso direto ao banco do outro.

## Documentação

- [`CLAUDE.md`](CLAUDE.md) — contexto de integração e convenção de código (pt-BR obrigatório)
- [`rn-protocolo.md`](rn-protocolo.md) — regras de negócio do SPD
- [`rn-central-de-usuarios.md`](rn-central-de-usuarios.md) — regras de negócio do CUD
- [`rn-recursos-humanos.md`](rn-recursos-humanos.md) — regras de negócio do RH
- [`git-workflow.md`](git-workflow.md) — fluxo de git (issues, branches, commits, PRs)

## Stack

- **CUD:** NestJS · Fastify · Prisma · PostgreSQL · Redis · Supabase Auth
- **SPD:** Next.js (App Router) · Prisma · PostgreSQL · Supabase Storage
- **Infra:** Supabase self-hosted (local)

## Infraestrutura local (Docker)

Um único PostgreSQL (Supabase CLI) com schemas isolados `cud`/`spd`/`rh` + Redis (cache).

```bash
# pré-requisitos: Docker Desktop, Supabase CLI, pnpm

npm run infra:up      # supabase start + redis (docker compose)
npm run db:status     # chaves/URLs do Supabase → preencher os .env dos apps
npm run db:reset      # recria o banco e aplica supabase/migrations (cria schemas)
npm run infra:down    # derruba redis + supabase

# tabelas de cada sistema (Prisma) — ex.: CUD
cd sistemas/cud/auth-api && pnpm install && pnpm prisma:migrate --name init
```

## Rodar os apps (dev)

Scripts na raiz (cada um roda o app no diretório certo, com sua porta):

```bash
pnpm install              # instala 'concurrently' na raiz (para `dev` combinado)

pnpm dev                  # roda os apps existentes em paralelo
pnpm dev:cud-web          # admin-web do CUD     (quando criado)
pnpm dev:cud-api          # auth-api do CUD
pnpm dev:spd              # web do protocolo      (quando criado)
pnpm dev:rh-web           # web do RH             (quando criado)
pnpm dev:rh-api           # api do RH             (quando criado)
```

## Portas

Convenção: **cada sistema reserva um par (web, API)** — a API fica na porta **subsequente** à web.

| Sistema | Web | API |
|---------|-----|-----|
| CUD | 3000 | 3001 |
| SPD (protocolo) | 3002 | 3003 (reservado) |
| RH | 3004 | 3005 |

| Infra | Porta |
|-------|-------|
| Supabase API/Auth/Storage | 54321 |
| PostgreSQL | 54322 |
| Supabase Studio | 54323 |
| Redis | 6379 |

## Convenção

Nomenclatura **pt-BR** em todo código novo. Permissões no formato `MODULO:ACAO` (pt-BR) como contrato de integração entre os sistemas. Detalhes em [`CLAUDE.md`](CLAUDE.md).
