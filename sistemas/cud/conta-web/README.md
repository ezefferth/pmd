# CUD — conta-web

Portal de **autogestão da própria conta** (cidadão/externo e servidor). Next.js consumindo a auth-api.
Distinto do `admin-web` (gestor). Porta **3006**.

## Telas
- `/login`, `/cadastro` (autoregistro externo), `/recuperar-senha` — públicas
- `/` — **minha conta** (autenticado): dados de contato, e-mail secundário, telefone secundário,
  alterar e-mail (com revalidação) e alterar senha

## Endpoints usados (auth-api)
- `POST /autenticacao/login`, `POST /autenticacao/recuperar-senha`
- `POST /usuarios/auto-registro`
- `GET /perfil`, `PATCH /perfil`, `POST /perfil/senha`, `POST /perfil/email`

## Rodar
```bash
cp .env.example .env   # AUTH_API_URL, NEXT_PUBLIC_MUNICIPIO
pnpm install
pnpm dev               # http://localhost:3006
```

> Marca via `src/lib/tema.ts` (cópia de `marca/`). Gotham licenciada — fallback `Montserrat`.
> ⚠️ Scaffold validado com `next build`.
