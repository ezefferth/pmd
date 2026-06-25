---
name: geral
description: Use para tarefas gerais de desenvolvimento no workspace PMD (Dourados/MS) que não são específicas de um único sistema — convenções de código pt-BR, infraestrutura compartilhada (Supabase local, schemas cud/spd), padrões transversais e decisões de arquitetura entre CUD e SPD.
---

# geral

> Skill transversal do workspace **PMD** (Prefeitura Municipal de Dourados/MS).
> Use quando a tarefa não pertence só ao SPD nem só ao CUD, ou envolve a integração entre eles.

## Quando usar
- (preencher: gatilhos — ex.: "convenções gerais", "infra compartilhada", "integração CUD↔SPD")

## Contexto do workspace
- Dois sistemas: `CUD` (central de usuários / IdP) e `SPD` (protocolo digital)
- Infra compartilhada: Supabase local (PostgreSQL com schemas `cud` e `spd`), Redis
- Convenção pt-BR obrigatória em todo o ecossistema (ver `CLAUDE.md` raiz)
- Regras de negócio: `rn-central-de-usuarios.md` (CUD) e `rn-protocolo.md` (SPD)

## Regras / convenções a seguir
- Nomenclatura pt-BR (funções, variáveis, tipos, enums); exceções: termos de framework
- Permissões `MODULO:ACAO` em pt-BR como contrato de integração
- Para decisões de **arquitetura/qualidade de código** (React/Next/Prisma/Supabase), siga a skill global `software-architecture`. No PMD ela se aplica com nomenclatura **pt-BR** (a skill defere ao `CLAUDE.md` do projeto).
- (preencher: padrões transversais — commits, lint, estrutura, etc.)

## Passos / checklist
1. (preencher)
2. (preencher)

## Validação
- (preencher)
