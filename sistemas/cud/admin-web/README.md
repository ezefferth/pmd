# CUD — admin-web

Gerenciador de usuários (gestor). Next.js (App Router) consumindo a **auth-api** do CUD.

## Pré-requisitos
- auth-api rodando (`pnpm -C sistemas/cud/auth-api dev` → :3001)
- pnpm

## Configuração
```bash
cp .env.example .env   # AUTH_API_URL, NEXT_PUBLIC_MUNICIPIO
pnpm install
pnpm dev               # http://localhost:3000
```

## Estrutura
```
src/
├── app/
│   ├── layout.tsx          # injeta a marca (CSS vars) do município
│   ├── login/page.tsx      # login (client) → /api/sessao
│   ├── api/sessao/route.ts # POST login / DELETE logout (cookie httpOnly)
│   └── (painel)/           # área autenticada
│       ├── layout.tsx      # shell (sidebar + sair)
│       ├── page.tsx        # dashboard
│       └── usuarios/page.tsx
├── components/sair-button.tsx
├── lib/api.ts              # fetch autenticado (Bearer do cookie)
├── lib/tema.ts             # tema do município (cópia local de marca/)
└── middleware.ts           # protege rotas; sem sessão → /login
```

## Marca / tema
As cores e tipografia vêm de `src/lib/tema.ts` (cópia local de `marca/` da raiz).
Fonte **Gotham** é licenciada — fallback `Montserrat`/`system-ui` para dev.
Para outro município: novo tema em `tema.ts` + `NEXT_PUBLIC_MUNICIPIO`.

## A criar (próximas telas — issue #20)
Sistemas, Perfis, Acessos, Auditoria, Configurações; ações de criar/editar usuário; mini-perfil.

> ⚠️ Scaffold ainda **não compilado** localmente (sem `pnpm install`/`next build` no ambiente).
