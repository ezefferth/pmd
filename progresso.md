# 📌 Progresso da Suíte PMD

Histórico do que já foi construído e o que falta — ponto de retomada.
Última atualização: **2026-06-26**.

---

## Estado por sistema

| Sistema | Regra de negócio | Backend | Frontend |
|---------|------------------|---------|----------|
| **CUD** (Central de Usuários) | ✅ `rn-central-de-usuarios.md` v1.5.0 | ✅ **completo** (auth-api + sync RH + grupos de acesso) | ✅ admin-web · ✅ conta-web |
| **RH** (Recursos Humanos) | ✅ `rn-recursos-humanos.md` v1.0.0 | ✅ api: schema + domínios + sync→CUD (#35/#39/#40) | ✅ rh-web (#61): unidades, carreiras, cargos, servidores, movimentações |
| **SPD** (Protocolo) | ✅ `rn-protocolo.md` v2.4.0 | 🟡 schema (estendido c/ legado NEA) + scaffold (#42) + abertura portal (#54) + tramitação (#59) | 🟡 portal cidadão + cadastros internos + tramitação (processos) |

> Documentos transversais: `CLAUDE.md` (convenção pt-BR + integração), `git-workflow.md`,
> `marca/` (tema multi-município), `progresso.md` (este).

---

## CUD — implementado e validado (`tsc`/`nest build`/`next build` OK)

### auth-api (`sistemas/cud/auth-api`) — NestJS 11 · Fastify · Prisma 6 · Supabase Auth · ioredis
| Módulo | PR | Conteúdo |
|--------|----|----------|
| schema Prisma | #9 | Usuario, Sistema, Perfil, Acesso, Setor, AdministradorSetor, FichaFuncional, LogAuditoria + enums |
| scaffold | #11 | Fastify, prefixo `api/v1`, PrismaModule, `GET /saude` |
| infra | #21/#22 | Supabase CLI + schemas `cud/spd/rh` + Redis + scripts `infra:up`/`dev:*` |
| autenticação | #23 | `POST /autenticacao/login`, `recuperar-senha`, `GET /eu`; `JwtAuthGuard`, `AdminGlobalGuard` |
| usuários | #25 | CRUD, autoregistro externo, vínculo, status; CPF; rollback Supabase→banco; matrícula por vínculo (RN-CUD-061) |
| sistemas/perfis/acessos | #26 | CRUD + **`GET /acessos/verificar`** + cache Redis (TTL 45s) |
| administração por setor | #27 | Setor (árvore), AdministradorSetor, `resolverEscopo`, lotação, `meu-escopo` |
| auditoria global | #29 | `GET /auditoria` (filtros/paginado), `@Contexto` (ator/IP/UA), instrumentação (RN-CUD-058) |
| perfil próprio | #33 | `GET/PATCH /perfil`, `POST /perfil/senha`, `POST /perfil/email` |
| grupos de acesso | #57 | `GrupoAcesso`/`GrupoAcessoPerfil` + CRUD `/grupos-acesso` + `POST /:id/aplicar` (concede 1 acesso por perfil, reusa `AcessosService`); RN-CUD-019a/b/c |

### admin-web (`sistemas/cud/admin-web`) — Next 15 + Tailwind, porta 3000
| PR | Conteúdo |
|----|----------|
| #31 | scaffold + login (cookie httpOnly) + middleware + dashboard + lista de usuários; marca aplicada |
| #32 | telas: sistemas, perfis, acessos, auditoria, novo usuário, detalhe (mini-perfil: dados/acessos/status/vínculo), configurações |
| #57 | tela **Grupos de acesso**: lista + criar (perfis agrupados por sistema via checkbox) + aplicar a usuário + excluir (com toasts) |

### conta-web (`sistemas/cud/conta-web`) — Next 15, porta 3006
| PR | Conteúdo |
|----|----------|
| #33 | autogestão: login, cadastro (autoregistro externo), recuperar-senha; minha conta (dados, e-mail/telefone secundário, alterar e-mail/senha) |

> **O CUD está funcionalmente completo**, incluindo o **recebimento da sincronização do RH** (#40).

### UI — feedback (toasts)
- **sonner + `FormToast`** em **admin-web** e **conta-web** (#56): toast loading/sucesso/erro em **toda** ação CRUD; `<Toaster richColors>` nos layouts. Actions com `redirect()` passaram a retornar (navegação via `FormToast`). Padrão espelhado do SPD (#52).

---

## RH — api (`sistemas/rh/api`)

- Schema Prisma (schema `rh`): `UnidadeOrganizacional` (árvore), `Carreira`, `Cargo`, `FaixaSalarial`, `Servidor`, `DesignacaoConfianca`, `MovimentacaoFuncional`, `LogAuditoria` + enums (#35).
- **Módulos de domínio** (#39): unidades (árvore + ciclo), carreiras + faixas, cargos, servidores (admissão registra movimentação), movimentações.
- **Sync RH→CUD** (#40): `POST /sincronizacao/publicar` → publica setores + ficha funcional no CUD (protegido por `x-sync-key`).

### rh-web (`sistemas/rh/web`) — Next 15 + Tailwind, porta 3004
| PR | Conteúdo |
|----|----------|
| #61 | scaffold (espelha admin-web) + telas: dashboard, unidades (árvore), carreiras (+faixas), cargos (filtro por tipo), servidores (lista paginada/busca + admissão), servidor/[id] (ficha + movimentações + alterar situação). Consome a api do RH via `lib/api` server-side; toasts (`FormToast`). |

### Falta no RH
- Autenticação (endpoints hoje abertos, MVP) — proteger via CUD
- Sync por evento (webhook) e auditoria; edição de unidades/cargos (hoje criação + situação)

---

## SPD — iniciado (`sistemas/spd/web`) — PR #42

- Schema Prisma (schema `spd`) — núcleo: organograma, `Usuario` (espelho CUD), `ParteInteressada`, assuntos (+docs/campos adicionais), processo (`Processo`, `MovimentacaoProcesso`, interessados, documentos) + enums. **Guias/Betha removidos** (#47).
- Scaffold Next 15 + Tailwind + Prisma (singleton) + marca, porta 3002, home.
- **Toasts** sonner + `FormToast` (#52); cadastros internos (organograma, assuntos) com `FormToast`.
- **Portal do cidadão** (#54): grupo `portal/` separado da área interna. `abrir` (cascata secretaria→assunto→motivo + campos adicionais + requerente), gera `numeroProtocolo` `NNNNNN/AAAA` atômico (RN-022/023) + 1ª `MovimentacaoProcesso` CRIADO; `meus-processos` (acompanhamento por CPF). Login espelha CPF do CUD (`/perfil`).
- **Tramitação interna** (#59): área `(interno)/processos` (lista com filtro de status + detalhe com timeline). Server actions `src/actions/tramitacao.ts` (receber, atribuir, andamento, transferir, concluir, arquivar, reabrir, cancelar) — cada uma valida status de origem, cria `MovimentacaoProcesso` e atualiza `status`/`organogramaAtual`/atribuição em transação. **Responsável inativo** via `src/lib/responsavel.ts` (`resolverDestinoAtivo`, RN-087/088) + `realocarProcessosDeResponsavel` (RN-087/089). Toasts em todas as ações.
- **Documentos (peças)** (#63): `src/lib/storage.ts` (Supabase Storage, bucket privado `spd-documentos`, URL assinada) + `src/actions/documentos.ts` (`anexarDocumento`: upload + `Documento` com `numeroOrdem` sequencial RN-069 + `MovimentacaoProcesso` JUNTADA_DOCUMENTO). UI no detalhe do processo: lista de peças com download (URL assinada) + upload (`FormToast` com `input file`). Usa apenas campos do `Documento` da main (schema não alterado — há WIP do usuário).
- **Schema estendido a partir do legado NEA** (engenharia reversa de `banco_protocolo_nea.sql`, 2026-06-26): RN passou a **v2.4.0** (nova seção 20, RN-090..101; seção 2 marcada delegada ao CUD; RN-051 → auditoria field-level). Adições **aditivas** ao `schema.prisma`:
  - *Auditoria field-level* (derivada de `NA_AUDITORIA`): `LogAuditoria` (cabeçalho, sem FK p/ ator) + `LogAuditoriaItem` (1 linha por campo) + `ConfiguracaoAuditoria` (liga/desliga por tabela).
  - *Tramitação em lote + recepção* (`GUIA_REMESSA`): `GuiaRemessa`/`GuiaRemessaItem` + `UsuarioOrganograma.podeRecepcionar` + movimentos `REMESSA`/`RECEPCAO`.
  - *Fluxo por assunto* (`PROCEDIMENTO`): `ProcedimentoAssunto`/`ProcessoProcedimento` + `Assunto.seguirProcedimento`.
  - *Modelos de documento* (`MODELODOCUMENTO`): `ModeloDocumento`.
  - *Campos*: `Documento.movimentacaoId`/`hashArquivo`/`tamanhoBytes`; `Processo.codigoConsultaPublica` + `arquivoFisico*`.
  - **Tier 1** (fundacional): `ConfiguracaoSistema` (key-value), `AssuntoUsuarioAtribuido` (RN-021).
  - **Tier 2** (ciclo de vida): `PendenciaProcesso` (§18), `ProcessoVinculo` (§15, apenso/anexação) — tirando do limbo enums já existentes (`SOLICITACAO_PENDENCIA`, `APENSAMENTO`...).
  - **Tier 3** (assinatura/sigilo): `AssinaturaDocumento` (+`TipoAssinatura`, §16/RN-065..068, usa `hashDocumento`+`codigoVerificacao`) e `CredencialAcessoProcesso` (acesso nominal a `SIGILOSO`/`SECRETO`, RN-078/079).
  - **Tier 4** (notificações, §9/RN-048..050): `ConfiguracaoNotificacao` (regra por evento×assunto×setor, com flags de destinatário), `Notificacao` (interna, lida individual) e `NotificacaoCidadao` (e-mail ao requerente) + enum `TipoEvento` (15 valores).
  - **Schema agora cobre a RN inteira** (núcleo + Tiers 1–4); único bloco fora = Betha/guias. Migrations aplicadas: `..._auditoria_remessa_procedimentos_pendencias_vinculos` (281 l.) + `..._assinatura_credencial_sigilo` + `..._notificacoes`. Ver "Banco (dev)".

### Falta no SPD
- **Auth via CUD** (servidor e cidadão — #1): login básico já consome CUD; falta consolidar guarda das rotas internas e verificação de permissão
- **Lógica/UI sobre o schema novo** (modelos criados, sem actions/telas ainda): pendências/prazos (RN-072/073), apenso/anexação (§15), guia de remessa+recepção (RN-094/095), procedimentos por assunto (RN-096), auditoria field-level (RN-090).
- **Schema completo vs RN** ✅ — falta a **lógica/actions/UI** sobre os models (auditoria, remessa, pendências, vínculos, assinatura, credencial, notificações). Modelagem encerrada; só Betha/guias fora de escopo.
- Upload de documentos pelo cidadão no portal (hoje só na área interna)

---

## Portas

| App / Serviço | Porta |
|---------------|-------|
| CUD admin-web | 3000 |
| CUD auth-api | 3001 |
| SPD web (protocolo) | 3002 |
| SPD api | 3003 (reservado) |
| RH web | 3004 |
| RH api | 3005 |
| CUD conta-web | 3006 |
| Supabase API/Auth/Storage | 54321 · PostgreSQL 54322 · Studio 54323 · Redis 6379 |

> Convenção: cada sistema reserva o par (web, API subsequente). O CUD tem um **segundo** front (conta-web, 3006) por atender público distinto (autogestão).

---

## Decisões registradas (refletidas nas RN)

- **Identidade única no CUD** — externos/cidadãos se autoregistram no CUD (`tipoVinculo = EXTERNO`); SPD sem `Citizen` (issue #1).
- **Setores canônicos no CUD**, puxados do **RH** (SPD mantém organograma próprio).
- **Exoneração/aposentadoria** rebaixa para `EXTERNO` e revoga acessos internos.
- **Matrícula** só `EFETIVO`/`COMISSIONADO`; estagiário/externo sem matrícula (RN-CUD-061).
- **Permissões** `MODULO:ACAO` em **pt-BR**.

## Banco (dev) — status
- Infra Supabase **de pé** (containers rodando); **GoTrue/auth está parado** — rodar `supabase start` para subir o auth antes de testar login.
- **RH**: migration `init` **aplicada** (tabelas criadas no schema `rh`).
- **SPD**: ✅ **resetado e aplicado** (2026-06-26, com consentimento). O schema `spd` tinha a versão **inglesa abandonada** (migration `20260616012247_init`, 16/jun) divergindo da init pt-BR commitada — sem ancestral comum. Feito `prisma migrate reset` (só o schema `spd`) → reaplicada `20260626030001_init` (pt-BR) + `20260626132219_auditoria_remessa_procedimentos_pendencias_vinculos`. `migrate status`: **up to date**. ⚠️ Se outro ambiente de dev ainda tiver a migration inglesa `20260616012247_init`, também precisa de reset.
- **CUD**: o schema `cud` ainda tem **tabelas legadas** do projeto antigo (keycloak/`users`). As migrations foram **geradas** (`prisma/migrations/*`), mas **não aplicadas** — aplicar exige `prisma migrate reset` (ação destrutiva que o Prisma bloqueia para IA). **Ação do usuário:** rodar `pnpm prisma migrate reset` em `sistemas/cud/auth-api` (consentindo), depois `pnpm prisma migrate deploy`.
  - CUD: migrations `20260626030000_init` + `20260626120000_grupos_acesso` (incremental, valida contra o DDL do Prisma).
- `.env` de cada app criados localmente a partir do `.env.example` (não versionados).

## Fora de escopo (por ora)
- **Betha** (integração tributária) e **guias de pagamento** — removidos do schema/RN do SPD (#47). Retomar depois.

## Pendências de refino / externas
- `verificar` por API key: a **sincronização RH→CUD já usa `x-sync-key`** (#40); falta o mesmo para o `verificar` consumido pelo SPD.
- RH e SPD ainda **sem autenticação** (endpoints abertos/MVP); selects/paginação no admin-web.
- Verificação de e-mail depende da config do Supabase (Inbucket/confirmations).
- **Confirmar 2 cores do manual** (`#d1d1b`, `#1e1ec`) e **licença Gotham** (frontends).

## Issues abertas
#1 (auth SPD via CUD — parcial).
(#3 abertura cidadão SPD → **concluída** via #54; #6 responsável inativo → **concluída** via #59; #52 toasts SPD; #55/#56 toasts CUD; #57/#58 grupos de acesso; #18 sync, #34/#35 RH scaffold, #38/#39 RH domínios, #41/#42 SPD scaffold — concluídos.)

**Próximo na fila autônoma:** fila principal (1–6) concluída. Refinos de maior valor: gating de permissão via CUD `acessos/verificar` no SPD; selects/paginação no admin-web; upload de documentos pelo cidadão no portal; edição de cadastros no rh-web.

---

## Como retomar

```bash
npm run infra:up                     # Supabase + Redis
npm run db:reset                     # cria schemas cud/spd/rh

# CUD
cd sistemas/cud/auth-api && pnpm install && pnpm prisma:migrate --name init && pnpm dev   # :3001
cd sistemas/cud/admin-web && pnpm install && pnpm dev                                       # :3000
cd sistemas/cud/conta-web && pnpm install && pnpm dev                                       # :3006

# RH
cd sistemas/rh/api && pnpm install && pnpm prisma:migrate --name init && pnpm dev           # :3005

# SPD
cd sistemas/spd/web && pnpm install && pnpm prisma:migrate --name init && pnpm dev           # :3002

# fluxo: 1 issue = 1 branch = 1 PR (ver git-workflow.md)
```

**Próximo passo recomendado:** **auth do SPD via CUD (#1)** — login de servidor e cidadão pelo CUD; base para os demais módulos do SPD. Depois rh-web e cadastros do SPD.
