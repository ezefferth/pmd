---
name: git-workflow
description: Use ao trabalhar com git/GitHub neste monorepo PMD — criar issues, branches, commits e pull requests para funcionalidades, correções ou tarefas de integração CUD↔SPD. Aplica Conventional Commits com descrição em pt-BR, naming de branch tipo/escopo/descrição e o ciclo issue→branch→PR→merge definido em git-workflow.md.
---

# git-workflow (PMD)

> Monorepo único na raiz `PMD/` (cud + spd). Convenção completa em `git-workflow.md`.
> **Regra base:** 1 funcionalidade = 1 issue = 1 branch = 1 PR. Nada vai para `main` sem PR.

## Quando usar
- Ao iniciar/entregar funcionalidade, correção ou integração
- Ao criar issues, branches, commits ou PRs
- Ao orientar o usuário sobre o fluxo git da suíte

## Ao iniciar uma funcionalidade
1. Garantir que existe **issue** (template em `.github/ISSUE_TEMPLATE/`); se não, sugerir criar.
2. Aplicar labels: **tipo** (`feat|bug|refactor|docs|infra|integração|test`) + **escopo** (`cud|spd|infra-escopo|pmd`) + **status** (`status:em-andamento`).
3. Criar branch: `tipo/escopo/descricao-curta` (ex.: `feat/spd/abertura-processo`).

## Commits — Conventional Commits, descrição pt-BR
Formato: `tipo(escopo): descrição no imperativo em pt-BR`
- Tipo (inglês): `feat, fix, refactor, docs, chore, test, infra`
- Escopo (sistema): `cud, spd, infra, pmd`
- Ex.: `fix(cud): valida CPF antes de criar usuário no Supabase Auth`

## Pull Request
- Título no padrão Conventional Commits; corpo pelo `.github/PULL_REQUEST_TEMPLATE.md`.
- `Closes #N` para fechar a issue no merge; mover issue para `status:revisão`.
- Integração: ajustar **CUD primeiro** (produtor do contrato), depois **SPD** (consumidor).
- Merge: `squash and merge`; apagar branch.

## Regras do projeto
- Commit/push **somente quando o usuário pedir**.
- Nunca commitar segredos (`.env`); usar `process.env`.
- Nomenclatura de código em **pt-BR** (ver `CLAUDE.md`).
- Comandos GitHub via `gh` CLI.

## Comandos úteis
```bash
gh issue create --template funcionalidade.md
git switch -c feat/spd/abertura-processo
gh pr create --fill            # título/corpo a partir dos commits + template
bash .github/scripts/setup-labels.sh   # cria as labels no remote (gh autenticado)
```
