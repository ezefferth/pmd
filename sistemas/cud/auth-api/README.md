# CUD — auth-api

Backend do CUD (provedor de identidade). NestJS + Fastify + Prisma.

## Pré-requisitos
- Node 20+ e **pnpm**
- Infra subida na raiz do PMD: `supabase start` (PostgreSQL :54322, Auth :54321)

## Configuração
```bash
cp .env.example .env   # preencher chaves do Supabase (supabase status)
```

## Instalação e banco
```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate --name init   # cria as tabelas no schema `cud`
```

## Executar
```bash
pnpm dev          # http://localhost:3002
```

Saúde: `GET http://localhost:3002/api/v1/saude` → `{ "status": "ok", "servico": "cud-auth-api" }`

## Estrutura
```
src/
├── main.ts              # bootstrap Fastify, prefixo api/v1, ValidationPipe
├── app.module.ts        # ConfigModule + PrismaModule
├── app.controller.ts    # GET /saude
└── prisma/              # PrismaModule (global) + PrismaService
prisma/
└── schema.prisma        # modelos do CUD (schema PostgreSQL `cud`)
```

## Autenticação (Supabase Auth)
- `POST /api/v1/autenticacao/login` — `{ email, senha }` → `{ accessToken, usuario }`
- `POST /api/v1/autenticacao/recuperar-senha` — `{ email }` (delegado ao Supabase)
- `GET  /api/v1/autenticacao/eu` — dados do usuário autenticado (Bearer token)

Guards: `JwtAuthGuard` (valida JWT HS256 do Supabase + carrega `Usuario` ATIVO) e `AdminGlobalGuard`.

Próximos módulos: `usuarios`, `sistemas`, `perfis`, `acessos` (incl. `GET /acessos/verificar`).
