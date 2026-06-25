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

## Convenção

Nomenclatura **pt-BR** em todo código novo. Permissões no formato `MODULO:ACAO` (pt-BR) como contrato de integração entre os sistemas. Detalhes em [`CLAUDE.md`](CLAUDE.md).
