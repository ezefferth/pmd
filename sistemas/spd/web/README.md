# SPD — web

Sistema de Protocolo Digital. Next.js (App Router) + Prisma (schema `spd`) + Supabase Storage.
Porta **3002**. Regras: [`../../../rn-protocolo.md`](../../../rn-protocolo.md).

## Pré-requisitos
- Infra na raiz: `npm run infra:up`
- CUD rodando (autenticação/permissões): `pnpm -C sistemas/cud/auth-api dev`

## Instalação e banco
```bash
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate --name init   # cria as tabelas no schema `spd`
pnpm dev                          # http://localhost:3002
```

## Estrutura
```
prisma/schema.prisma   # núcleo do protocolo (organograma, assuntos, processos, ...)
src/
├── app/               # App Router (home; portal e interno a criar)
├── lib/prisma.ts      # PrismaClient singleton
└── lib/tema.ts        # marca do município
```

## A criar (follow-ups)
- Autenticação via CUD (servidor e cidadão — issue #1)
- Abertura de processo pelo cidadão (cascata + campos adicionais — issue #3)
- Módulos: organograma, assuntos, tramitação, documentos (Storage), guias (Betha)
- Schema avançado: assinatura, pendências, sigilo/credencial, notificações, vínculos
