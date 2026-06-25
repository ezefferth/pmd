# 🔀 Fluxo de Git — Suíte PMD (Dourados/MS)

Monorepo único na raiz `PMD/` contendo `cud/` e `spd/`. Um só histórico, um só rastreador de issues.

---

## Princípio

> 1 funcionalidade = 1 issue = 1 branch = 1 PR. Nada vai para `main` sem PR.

Toda funcionalidade, correção ou tarefa de integração **começa por uma issue**. A issue é o indicativo
do que está sendo trabalhado (label `status:em-andamento` + branch ativa + board do Project).

---

## 1. Issues

Abra pelo template adequado (`.github/ISSUE_TEMPLATE/`):

| Template            | Quando                                              |
|---------------------|-----------------------------------------------------|
| ✨ Funcionalidade   | Nova feature ou melhoria em CUD/SPD                 |
| 🐛 Bug              | Comportamento incorreto                            |
| 🔗 Integração       | Mudança no contrato CUD ↔ SPD                       |

Cada issue recebe **3 dimensões de label**:

- **tipo** — `feat`, `bug`, `refactor`, `docs`, `infra`, `integração`, `test`
- **escopo** — `cud`, `spd`, `infra-escopo`, `pmd`
- **status** — `status:backlog` → `status:em-andamento` → `status:revisão` (→ fechada no merge)
  - `status:bloqueado` quando travada por dependência

> Labels criadas com `bash .github/scripts/setup-labels.sh` (precisa de `gh` autenticado + remote).

---

## 2. Branches

Padrão: `tipo/escopo/descricao-curta`

```
feat/spd/abertura-processo-externo
fix/cud/valida-cpf-antes-supabase
docs/pmd/rn-prazos-sla
integração/cud/endpoint-verificar-acesso
```

- `main` é protegida e sempre estável.
- Uma branch por issue. Comece a partir de `main` atualizada.

---

## 3. Commits — Conventional Commits (descrição em pt-BR)

Formato: `tipo(escopo): descrição no imperativo, em pt-BR`

```
feat(spd): cria abertura de processo pelo portal do cidadão
fix(cud): valida CPF antes de criar usuário no Supabase Auth
refactor(spd): extrai cálculo de prazo para service
docs(pmd): adiciona RN de assinatura digital
chore(infra): sobe Redis no compose
```

- **Tipo em inglês** (padrão da ferramenta): `feat, fix, refactor, docs, chore, test, infra`.
- **Escopo** = sistema: `cud`, `spd`, `infra`, `pmd`.
- **Descrição em pt-BR**, no imperativo, sem ponto final.
- Referencie a issue no corpo quando útil: `Refs #12`.

---

## 4. Pull Request

- Título no mesmo padrão Conventional Commits.
- Corpo pelo template (`.github/PULL_REQUEST_TEMPLATE.md`), com `Closes #N` para fechar a issue no merge.
- Marque escopo, tipo e o checklist (pt-BR, sem segredos, RN respeitadas, validação).
- Mova a issue para `status:revisão` ao abrir o PR.

### Ordem em tarefas de integração
Ajuste o **CUD primeiro** (produtor do contrato), depois o **SPD** (consumidor) — pode ser no mesmo PR
(vantagem do monorepo: commit atômico) ou em PRs encadeados referenciando a mesma issue.

---

## 5. Merge

- Revisão aprovada + validação local descrita no PR.
- `Squash and merge` (histórico limpo: um commit por entrega na `main`).
- A issue fecha automaticamente pelo `Closes #N`.
- Apague a branch após o merge.

---

## Resumo do ciclo

```
issue (status:backlog)
  → branch tipo/escopo/desc  +  status:em-andamento
    → commits Conventional Commits (pt-BR)
      → PR (Closes #N)  +  status:revisão
        → squash and merge em main  →  issue fechada, branch apagada
```
