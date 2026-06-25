# 📌 Progresso da Suíte PMD

Histórico do que já foi construído e o que falta — ponto de retomada.
Última atualização: **2026-06-25**.

---

## Estado por sistema

| Sistema | Regra de negócio | Backend | Frontend |
|---------|------------------|---------|----------|
| **CUD** (Central de Usuários) | ✅ `rn-central-de-usuarios.md` v1.4.0 | 🟢 auth-api avançada (ver abaixo) | ⬜ admin-web (#20) · conta-web (#24) |
| **SPD** (Protocolo) | ✅ `rn-protocolo.md` v2.3.0 | ⬜ | ⬜ |
| **RH** (Recursos Humanos) | ✅ `rn-recursos-humanos.md` v1.0.0 | ⬜ | ⬜ |

> Documentos transversais: `CLAUDE.md` (convenção pt-BR + integração), `git-workflow.md`,
> `marca/` (tema multi-município), `progresso.md` (este).

---

## CUD — auth-api (`sistemas/cud/auth-api`) — implementado

Stack: NestJS 11 · Fastify · Prisma 6 · Supabase Auth · ioredis. **Compila** (`tsc` + `nest build` OK).

| Módulo | PR | Conteúdo |
|--------|----|----------|
| schema Prisma | #9 | Usuario, Sistema, Perfil, Acesso, Setor, AdministradorSetor, FichaFuncional, LogAuditoria + enums |
| scaffold | #11 | bootstrap Fastify, prefixo `api/v1`, PrismaModule, `GET /saude` |
| infra | #21/#22 | Supabase CLI + schemas `cud/spd/rh` + Redis (docker-compose) + scripts `infra:up` |
| autenticação | #23 | `POST /autenticacao/login`, `recuperar-senha`, `GET /eu`; `JwtAuthGuard`, `AdminGlobalGuard` |
| usuários | #25 | CRUD, autoregistro externo, vínculo, status; CPF válido; rollback Supabase→banco; matrícula por vínculo (RN-CUD-061) |
| sistemas/perfis/acessos | #26 | CRUD + **`GET /acessos/verificar`** + cache Redis (TTL 45s) |
| administração por setor | #27 | Setor (árvore), AdministradorSetor, `resolverEscopo`, lotação, `meu-escopo` |
| auditoria global | #29 (em revisão) | `GET /auditoria` (filtros + paginado), `@Contexto` (ator/IP/UA), instrumentação de usuários/acessos/setores (RN-CUD-058) |

> Com a #29, o **backend do CUD independente de RH/frontend está completo**.

### Falta no CUD
- **#18** ficha funcional + sync RH (depende do RH existir)
- **#20** admin-web (gestor) · **#24** conta-web (autogestão do próprio usuário)
- Proteger `GET /acessos/verificar` por credencial de sistema (hoje aberto — `TODO` no código)
- Mini-perfil (sistemas/módulos + histórico — RN-CUD-056/057)
- Auditar também mutações de sistemas/perfis (o `AuditoriaService` já é global)

---

## Convenção de portas (web + API subsequente)

| Sistema | Web | API |
|---------|-----|-----|
| CUD | 3000 | 3001 |
| SPD | 3002 | 3003 (reservado) |
| RH | 3004 | 3005 |

Infra: Postgres 54322 · Supabase API 54321 · Studio 54323 · Redis 6379.

---

## Decisões registradas (já refletidas nas RN)

- **Identidade única no CUD** — cidadãos/externos se autoregistram no CUD (`tipoVinculo = EXTERNO`); SPD não tem mais `Citizen` (issue #1).
- **Setores canônicos no CUD**, futuramente puxados do **RH** (SPD mantém organograma próprio).
- **Exoneração/aposentadoria** rebaixa para `EXTERNO` e revoga acessos internos.
- **Matrícula** só para `EFETIVO`/`COMISSIONADO`; estagiário/externo sem matrícula (RN-CUD-061).
- **Permissões** `MODULO:ACAO` em **pt-BR** (contrato com o CUD).
- **Gotham** é fonte licenciada; **2 cores do manual vieram malformadas** (`#d1d1b`, `#1e1ec`) — pendente confirmar.

## Issues abertas (backlog de implementação)
#1 (identidade SPD↔CUD) · #3 (abertura cidadão SPD) · #6 (status inativo) ·
#18 #20 #24 (CUD) · demais módulos do SPD e RH a abrir conforme avançarmos.
(#19 auditoria entregue na PR #29.)

---

## Como retomar

```bash
# subir infra e validar de ponta a ponta
npm run infra:up
npm run db:reset                     # cria schemas cud/spd/rh
cd sistemas/cud/auth-api
pnpm install && pnpm prisma:migrate --name init
pnpm dev                             # http://localhost:3001/api/v1/saude

# fluxo de trabalho: 1 issue = 1 branch = 1 PR (ver git-workflow.md)
```

**Próximo passo recomendado:** mergear #29 (auditoria) e partir para o **frontend do CUD** — #20 (admin-web) ou #24 (conta-web). #18 (sync RH) quando o RH começar.
