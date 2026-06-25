---
name: dev-protocolo
description: Use ao desenvolver o SPD (Sistema de Protocolo Digital de Dourados/MS) — abertura e tramitação de processos, organograma, assuntos, documentos, pagamentos/guias, integração Betha, portal do cidadão. Aplica as regras de negócio de rn-protocolo.md e a convenção pt-BR do PMD.
---

# dev-protocolo

> Skill de desenvolvimento do **SPD — Sistema de Protocolo Digital**.
> Fonte de regras: `rn-protocolo.md` (raiz do workspace). Convenção de código: `CLAUDE.md` raiz (pt-BR obrigatório).

## Quando usar
- (preencher: gatilhos específicos — ex.: "ao criar/editar models, rotas ou telas do SPD")

## Contexto técnico
- Stack: Next.js (App Router) · Prisma ORM · PostgreSQL (schema `spd`, Supabase local) · Supabase Storage
- Dois públicos: servidores internos (`(internal)/`) e cidadãos (`(portal)/`)
- Permissões no formato `MODULO:ACAO` em pt-BR (contrato com o CUD)

## Regras / convenções a seguir
- Nomenclatura pt-BR em todo código novo (ver tabela no `CLAUDE.md` raiz)
- Respeitar as regras de negócio RN-001..RN-079 de `rn-protocolo.md`
- (preencher: padrões de pasta, validação, tratamento de erro, etc.)

## Passos / checklist
1. (preencher)
2. (preencher)

## Exemplos
```ts
// (preencher: snippet de referência seguindo o padrão do projeto)
```

## Validação
- (preencher: ex.: `npx prisma generate`, `npm run build`, teste manual da rota)
