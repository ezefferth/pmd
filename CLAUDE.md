# PMD — Suíte de Sistemas da Prefeitura Municipal de Dourados/MS

Workspace raiz que agrupa dois sistemas municipais interdependentes.
Trabalhe sempre dentro do subprojeto correto; este arquivo fornece o contexto de integração entre eles.

---

## Convenção de código — obrigatória em todo o ecossistema PMD

### Nomenclatura em português (pt-BR)
Todo código novo **deve** usar pt-BR em funções, variáveis, parâmetros, constantes e tipos.
Exceções: nomes impostos por frameworks (decorators NestJS, hooks React, palavras-chave Prisma) permanecem em inglês.

| Categoria | Padrão | Exemplos |
|-----------|--------|---------|
| Funções / métodos | camelCase pt-BR | `buscarPorId`, `criarProcesso`, `listarAcessos`, `redefinirSenha` |
| Variáveis | camelCase pt-BR | `usuario`, `totalPaginas`, `dadosPaginados`, `listaErros` |
| Parâmetros | camelCase pt-BR | `pagina`, `limite`, `busca`, `operadorId` |
| Booleanos | prefixo `esta/pode/tem/eh` | `estaAtivo`, `podeEditar`, `temAcesso`, `ehAdmin` |
| Constantes | SCREAMING_SNAKE pt-BR | `TEMPO_EXPIRACAO_SESSAO`, `TAMANHO_MAXIMO_ARQUIVO` |
| Tipos / Interfaces de saída | PascalCase pt-BR | `UsuarioResumo`, `UsuarioDetalhe`, `ResultadoPaginado`, `VerificarAcessoResposta` |
| DTOs de entrada (NestJS) | PascalCase pt-BR + sufixo `Dto` | `CriarUsuarioDto`, `AtualizarSistemaDto`, `ConcederAcessoDto` |
| Enums | PascalCase pt-BR; membros SCREAMING_SNAKE | `StatusProcesso`, `AcaoAuditoria`, `TipoAtribuicao` |
| Rotas URL | kebab-case pt-BR | `/usuarios`, `/meus-processos`, `/redefinir-senha` |

> `Dto` é convenção do NestJS (framework) — permanece em inglês. Tipos de resposta e interfaces genéricas usam pt-BR puro (`Resposta`, `Resumo`, `Detalhe`).

```ts
// correto
async function buscarUsuarioPorEmail(email: string): Promise<UsuarioDetalhe | null> {
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  const estaAtivo = usuario?.ativo ?? false
  return estaAtivo ? usuario : null
}

// errado — variáveis e função em inglês
async function findUserByEmail(email: string) {
  const user = await prisma.usuario.findUnique({ where: { email } })
  const isActive = user?.ativo ?? false
  return isActive ? user : null
}
```

### Comentários essenciais
Comente **somente** quando o PORQUÊ não for óbvio pelo código. Nunca descreva o que o código faz.

Casos que exigem comentário:
- Integração entre sistemas: `// sincroniza com Supabase Auth antes de salvar no banco`
- Regra de negócio numerada: `// RN-023: incremento atômico — sem race condition`
- Restrição externa: `// Betha exige bethaId antes de criar lançamento`
- Comportamento contra-intuitivo: `// @Public() aqui porque sistemas externos usam JWT próprio`
- Decisão de arquitetura local: `// cache curto — dado muda com concessão de acesso`

```ts
// correto — explica restrição não óbvia
async function criarUsuario(dto: CriarUsuarioDto) {
  // Supabase Auth precisa existir antes do banco — se falhar aqui, rollback total
  const supabaseId = await this.supabase.criarUsuario(dto)
  return this.prisma.usuario.create({ data: { ...dto, keycloakId: supabaseId } })
}

// errado — descreve o que o código já mostra
// Cria o usuário no Supabase e depois salva no banco
async function criarUsuario(dto: CriarUsuarioDto) { ... }
```

---

## Estrutura do workspace

```
PMD/
├── sistemas/
│   ├── cud/   # Central de Usuários de Dourados — auth + identidade de todos os sistemas
│   ├── spd/   # Sistema de Protocolo Digital — tramitação de processos
│   └── rh/    # Recursos Humanos — dado-mestre funcional (alimenta o CUD)
└── supabase/  # infraestrutura local compartilhada (PostgreSQL + Auth + Storage)
```

> Os subprojetos ficam sob `sistemas/`. Comandos `cd cud`/`cd spd` neste documento referem-se a
> `sistemas/cud`/`sistemas/spd` (paths serão consolidados conforme cada app for criado).

Cada subprojeto terá seu próprio `CLAUDE.md` com stack, schema, regras e comandos detalhados.
Leia o CLAUDE.md do subprojeto antes de editar qualquer arquivo dentro dele.

---

## Os dois sistemas

### CUD — Banco Central de Usuários (BCU)
**Papel:** provedor de identidade (IdP) e repositório central de usuários municipais. Ponto único de verdade — todos os sistemas consultam o CUD para saber quem é o usuário e quais acessos ele tem.

- Monorepo pnpm: `auth-api` (NestJS/Fastify, porta 3001) + `admin-web` (Next.js 15, porta 3000)
- Supabase Auth (GoTrue) como engine de autenticação — email+senha, JWT HS256
- PostgreSQL (schema `cud`, via Supabase local) + Redis 7
- Gerencia usuários municipais, sistemas registrados, perfis de acesso e auditoria
- Expõe `GET /acessos/verificar` para que sistemas externos checem permissões granulares

### SPD — Sistema de Protocolo Digital
**Papel:** abertura, tramitação e acompanhamento de processos pelo cidadão e servidor.

- Single app Next.js (App Router) em `spd/web/`, porta 3000
- Prisma + PostgreSQL (schema `spd`, via Supabase local) + Supabase Storage (documentos)
- Integração externa crítica com API Betha (tributário)
- Dois públicos: servidores internos (`(internal)/`) e cidadãos (`(portal)/`)
- Autenticação própria: JWT com `jose` em cookie httpOnly para servidores; CPF+senha para cidadãos

---

## Arquitetura de integração (estado alvo)

```
Cidadão → portal SPD → autenticação própria (Citizen/CPF)

Servidor → SPD interno → Supabase Auth (CUD) → JWT HS256
                                     ↓
                    auth-api CUD → perfil + permissões granulares
                                     ↓
                    SPD consulta GET /acessos/verificar?usuarioId=X&sistemaId=spd&permissao=PROCESSES:CREATE
```

**Hoje:** SPD usa autenticação própria para servidores internos (User + senha, JWT gerado localmente).
**Alvo:** servidores internos do SPD autenticam via Supabase Auth (CUD). Cidadãos continuam com autenticação própria do portal.

---

## Contrato de integração SPD ↔ CUD

### Registro do SPD no CUD
```
Sistema no banco CUD:
  nome: "Sistema de Protocolo Digital"
  slug: "spd"
  urlBase: "http://localhost:3002"

Perfis mínimos necessários no CUD para o SPD:
  "admin-spd"       → permissões: ["*"]
  "gestor-spd"      → permissões: ["PROCESSES:APPROVE","PROCESSES:TRANSFER","PROCESSES:CONCLUDE","USERS:READ"]
  "analista-spd"    → permissões: ["PROCESSES:CREATE","PROCESSES:UPDATE","MOVEMENTS:CREATE","DOCUMENTS:CREATE"]
  "servidor-spd"    → permissões: ["PROCESSES:READ","MOVEMENTS:READ","DOCUMENTS:READ"]
  "consulta-spd"    → permissões: ["PROCESSES:READ"]
```

### Como o SPD verificará permissão via CUD
```http
GET http://localhost:3001/api/v1/acessos/verificar
  ?usuarioId={supabaseId}
  &sistemaId={cud_sistema_id_do_spd}
  &permissao={PermissionModule}:{PermissionAction}

Response: { temAcesso: boolean, perfil: string, permissoes: string[] }
```

Chave de mapeamento: `usuarios.keycloakId` no CUD = `sub` do JWT Supabase = identificador do servidor no SPD.

### Fluxo de autenticação no SPD (após integração)
```
1. Servidor acessa /login no SPD
2. SPD valida credenciais contra Supabase Auth (CUD) — email+senha
3. Supabase Auth retorna JWT HS256 (access_token)
4. SPD armazena JWT em cookie httpOnly
5. Para ações sensíveis: SPD chama GET /acessos/verificar com Bearer token
```

---

## Mapeamento de entidades entre sistemas

| SPD | CUD | Supabase Auth |
|-----|-----|---------------|
| `User.id` | `Usuario.id` | — |
| `User.email` | `Usuario.email` | `email` |
| — | `Usuario.keycloakId` | `id` (sub do JWT) |
| `User.name` | `Usuario.nome` | `user_metadata.nome` |
| `User.cpf` | `Usuario.cpf` | `user_metadata.cpf` |
| `User.matricula` | `Usuario.matricula` | `user_metadata.matricula` |
| `Profile` (SPD) | `Perfil` (CUD) | — |
| `PermissionModule:PermissionAction` | `permissoes[]` string no `Perfil` | — |

> O campo `keycloakId` foi mantido por compatibilidade de nome; armazena o `id` do Supabase Auth.

---

## Roadmap de integração (por fase)

### Fase 0 — Fundação ← estado atual
- [x] CUD: infraestrutura completa, auth-api funcional, admin-web funcional
- [x] SPD: sistema completo com autenticação própria para servidores

### Fase 1 — Registrar SPD no CUD
- [ ] Registrar sistema SPD via `POST /sistemas` na auth-api
- [ ] Criar perfis SPD via `POST /sistemas/{id}/perfis` (5 perfis acima)
- [ ] Criar servidores municipais no CUD via `POST /usuarios` (sincronizar base inicial do SPD)

### Fase 2 — Autenticação via CUD no SPD
- [ ] Substituir `src/actions/auth.ts` (login de User) pelo fluxo com Supabase Auth do CUD
- [ ] Manter `src/lib/session.ts` para sessão de cidadão (portal) — não alterar
- [ ] Adaptar `proxy.ts` para validar JWT Supabase para rotas `(internal)/`
- [ ] Manter autenticação por CPF/senha para cidadãos em `(portal)/`

### Fase 3 — Verificação de permissões via CUD
- [ ] Criar `src/lib/cud.ts` no SPD — client HTTP para `GET /acessos/verificar`
- [ ] Adaptar `src/lib/permissions.ts` para buscar permissões do CUD (em vez de banco local)
- [ ] Definir estratégia de cache (in-memory com TTL curto) para evitar latência

### Fase 4 — Consolidação
- [ ] Migrar gestão de usuários do SPD para o CUD (CRUD via admin-web do CUD)
- [ ] Remover tabelas `User`, `Profile`, `AccessGroup` do schema SPD (ou manter só para legado)
- [ ] Testes de integração completos

---

## Infraestrutura compartilhada (Supabase local)

PostgreSQL, Auth e Storage são gerenciados por um único Supabase na raiz do PMD.
Cada sistema usa um **schema isolado** dentro do mesmo banco `postgres`.

```
PostgreSQL :54322
├── schema: public     ← Supabase interno
├── schema: cud        ← CUD Prisma
└── schema: spd        ← SPD Prisma
```

### Comandos de infra (executar na raiz PMD/)

```bash
# Subir infra completa
supabase start               # PostgreSQL :54322 · Auth :54321 · Studio :54323

# Ver chaves do Supabase (preencher nos .env dos apps)
supabase status

# Redis (na pasta cud/)
pnpm infra:up                # sobe Redis :6379
pnpm infra:down              # para Redis

# Parar Supabase
supabase stop
```

### Migrations de schema (Supabase)

```bash
# Aplicar migrations de infra (cria schemas cud/spd)
supabase db reset            # dev — recria tudo
```

### Migrations de tabelas (Prisma — por projeto)

```bash
# CUD (dentro de cud/)
pnpm db:migrate              # cria tabelas no schema cud

# SPD (dentro de spd/web/)
npx prisma migrate dev       # cria tabelas no schema spd
```

---

## Como trabalhar com este workspace

### Quando alterar CUD
- Gestão de usuários, sistemas, perfis ou acessos entre sistemas
- Infraestrutura (Supabase Auth, Redis, schema CUD)
- Logs de auditoria do CUD

```bash
# dentro de cud/
pnpm infra:up       # Redis (PostgreSQL/Auth já estão no Supabase)
pnpm dev:api        # auth-api na porta 3001
pnpm dev:web        # admin-web na porta 3000
```

### Quando alterar SPD
- Tramitação de processos, assuntos, organograma, documentos
- Portal do cidadão
- Integração Betha

```bash
# PostgreSQL já está no Supabase (supabase start na raiz)

# dentro de spd/web/
npm run dev         # porta 3000 (ou 3002 quando rodando junto com CUD)
```

### Quando alterar ambos
Tarefas de integração (Fase 1 a 4 acima). Nesse caso:
1. Identifique qual contrato muda (endpoint, payload, mapeamento de entidade)
2. Ajuste o CUD primeiro (produtor do contrato)
3. Ajuste o SPD em seguida (consumidor do contrato)
4. Valide com os dois serviços rodando simultaneamente

---

## Portas em desenvolvimento (com ambos rodando)

| Serviço | Porta |
|---------|-------|
| Supabase Studio | 54323 |
| Supabase API / Auth / Storage | 54321 |
| PostgreSQL direto | 54322 |
| Redis | 6379 |
| CUD admin-web | 3000 |
| CUD auth-api | 3001 |
| SPD web (protocolo) | 3002 |
| SPD api | 3003 (reservado) |
| RH web | 3004 |
| RH api | 3005 |

> Convenção: cada sistema reserva um par (web, API) — a API fica na **porta subsequente** à web.
> Supabase Studio (:54323) visualiza os schemas `cud`/`spd`/`rh` em um único lugar.

---

## Decisões arquiteturais (nível PMD)

**Por que o SPD não abandona a autenticação própria para cidadãos?**
Cidadãos não são usuários municipais. O portal usa autenticação por CPF com conta `Citizen` própria. Somente os servidores internos migram para o CUD.

**Por que autenticação separada para cidadãos e servidores?**
Escala diferente, dados diferentes (CPF ≠ matrícula) e fluxos diferentes (portal público vs. sistema interno). Manter separado reduz risco e superfície de ataque.

**Por que `permissoes[]` no CUD são strings `MODULE:ACTION` compatíveis com o SPD?**
O formato `PermissionModule:PermissionAction` já usado pelo SPD é o contrato de permissão granular também no CUD. Isso elimina camada de tradução na Fase 3.

**Por que manter o Betha separado do CUD?**
Betha é integração tributária específica do SPD. O CUD é auth agnóstico de domínio. Misturar acoplaria o IdP a regras de negócio do protocolo.

**Por que Supabase local com schemas ao invés de bancos separados?**
Supabase CLI gerencia um único banco `postgres`. Schemas isolam os dados por sistema sem overhead de múltiplas instâncias. O Studio visualiza todos os schemas em um único lugar, e o Storage local substitui o Supabase cloud para documentos do SPD sem custo adicional.

**Por que Supabase Auth e não um IdP separado (ex-Keycloak)?**
Supabase Auth (GoTrue) é mais leve, sem dependência Java, e integra nativamente com o PostgreSQL que já usamos. Para o volume da prefeitura, JWT HS256 com `app_metadata.roles` é suficiente e mais simples de operar on-premises.
