# RH — api

Backend do RH (Recursos Humanos). NestJS + Fastify + Prisma. Porta **3005**.
Dado-mestre funcional (cargos, vínculos, lotação) — alimenta o CUD. Regras: [`../../../rn-recursos-humanos.md`](../../../rn-recursos-humanos.md).

## Pré-requisitos
- Node 20+ e pnpm
- Infra na raiz: `npm run infra:up` (PostgreSQL :54322)

## Instalação e banco
```bash
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate --name init   # cria as tabelas no schema `rh`
pnpm dev                          # http://localhost:3005/api/v1/saude
```

## Estrutura
```
src/
├── main.ts            # bootstrap Fastify, prefixo api/v1, porta 3005
├── app.module.ts      # ConfigModule + PrismaModule
├── app.controller.ts  # GET /saude
└── prisma/            # PrismaModule (global) + PrismaService
prisma/
└── schema.prisma      # UnidadeOrganizacional, Carreira, Cargo, FaixaSalarial,
                       # Servidor, DesignacaoConfianca, MovimentacaoFuncional, LogAuditoria
```

Próximos módulos: unidades, cargos/carreiras, servidores, movimentações; **sync RH→CUD** (issue #18).
