# 📋 Regras de Negócio — Sistema de Recursos Humanos (RH)
**Prefeitura Municipal de Dourados/MS**
Versão: 1.0.0 | Stack: **monorepo** — `rh-api` (NestJS · Fastify) + `rh-web` (Next.js App Router) · Prisma ORM · PostgreSQL (Supabase Self-Hosted, schema `rh`)

> **Papel:** o RH é o **dado-mestre funcional** dos servidores municipais — estrutura organizacional
> oficial, cargos/carreiras (plano de cargos), vínculos, lotação, situação funcional e (futuramente)
> frequência. Ele **alimenta o CUD** com a ficha funcional e a árvore de setores.
>
> **Limites:** o RH **não autentica** usuários nem concede permissões a sistemas — isso é do **CUD**.
> A correlação entre os sistemas é por **CPF** (= `Usuario.cpf` no CUD) e `matricula`.
>
> **Convenção:** nomenclatura pt-BR obrigatória (ver `CLAUDE.md` raiz).

---

## 1. PAPEL E INTEGRAÇÃO

- **RN-RH-001:** O RH é o **dado-mestre funcional** (estrutura, cargos, vínculos, lotação, situação). O CUD e os demais sistemas **consomem** esses dados; nenhum outro sistema grava ficha funcional.

- **RN-RH-002:** O RH **não** realiza autenticação nem concede permissões a sistemas. Login, identidade e acessos são do **CUD**. A correlação é feita por **CPF** e `matricula`; o `id` do servidor no RH é referenciado no CUD como `rhId`.

---

## 2. ESTRUTURA ORGANIZACIONAL

- A estrutura oficial do município é uma **árvore** de `UnidadeOrganizacional` (campos: `id`, `nome`, `sigla`, `tipo`, `paiId?`, `ativo`).

- Tipo da unidade (enum `TipoUnidade`): `SECRETARIA`, `DEPARTAMENTO`, `COORDENADORIA`, `SETOR`.

- **RN-RH-003:** A estrutura é uma árvore via `paiId` (raiz = `SECRETARIA`). É a estrutura **oficial** do município, base da lotação dos servidores.

- **RN-RH-004:** Esta árvore é a **fonte canônica** dos setores: é sincronizada para o CUD (`Setor`) e pode ser mapeada/consumida pelo `Organograma` do SPD. O RH é o produtor; o CUD e o SPD são consumidores.

---

## 3. CARGOS E CARREIRAS (Plano de Cargos)

- `Carreira` (campos: `id`, `nome`, `descricao?`, `leiReferencia?`, `ativo`).
- `Cargo` (campos: `id`, `nome`, `tipo`, `carreiraId?`, `simbolo?`, `escolaridadeExigida?`, `cargaHorariaSemanal`, `quantidadeVagas?`, `leiCriacao?`, `ativo`).
- `FaixaSalarial` (campos: `id`, `carreiraId`, `classe`, `referencia`, `vencimentoBase`).

- Tipo do cargo (enum `TipoCargo`): `EFETIVO`, `COMISSAO`, `FUNCAO_GRATIFICADA`, `ESTAGIO`, `TEMPORARIO`, `ELETIVO`.

- **RN-RH-005:** Cargos `EFETIVO` pertencem a uma `Carreira` e seguem o **plano de cargos e carreiras** (matriz `classe × referencia` em `FaixaSalarial`), definido por **lei municipal** (carga inicial via seed/importação).

- **RN-RH-006:** Cargos `COMISSAO` (cargo de confiança / livre nomeação) possuem `simbolo` (ex.: `CC-1`, `DAS-2`), **não exigem concurso** e **não** pertencem a carreira efetiva.

- **RN-RH-007:** `FUNCAO_GRATIFICADA` (FG) é função de confiança atribuível a **servidor efetivo**, paga como gratificação **sem** desligá-lo do cargo efetivo.

- **RN-RH-008:** O cargo controla `quantidadeVagas`. Nomeações não devem exceder as vagas (bloqueio ou alerta, conforme configuração).

---

## 4. SERVIDORES E VÍNCULOS

- `Servidor` (campos: `id`, `cpf`, `nome`, `matricula`, `tipoVinculo`, `regimeJuridico`, `cargoId`, `unidadeLotacaoId`, `classe?`, `referencia?`, `situacao`, `dataAdmissao`, `dataExoneracao?`, `cargaHoraria`, `ativo`).

- Tipo de vínculo (enum `TipoVinculoFuncional`):
  | Valor          | Descrição                                                          |
  |----------------|--------------------------------------------------------------------|
  | `EFETIVO`      | Cargo efetivo, ingresso por **concurso público**                  |
  | `COMISSIONADO` | Cargo em comissão, **livre nomeação** (confiança)                 |
  | `ESTAGIARIO`   | Estagiário (termo de compromisso)                                 |
  | `ELETIVO`      | Agente político eleito (prefeito, vice, vereadores)               |
  | `TEMPORARIO`   | Contratação por tempo determinado (excepcional interesse público) |

- Regime (enum `RegimeJuridico`): `ESTATUTARIO`, `CELETISTA`, `ESPECIAL`.

- **RN-RH-009:** `matricula` é **única** e existe apenas para vínculos com matrícula formal (`EFETIVO`/`COMISSIONADO`). **Estagiários não possuem matrícula** (`null`). O `cpf` correlaciona o servidor à conta única no CUD (`Usuario.cpf`). Ver RN-CUD-061.

- **RN-RH-010:** O `tipoVinculo` deve ser compatível com o tipo do cargo (`EFETIVO`↔`EFETIVO`, `COMISSIONADO`↔`COMISSAO`, `ESTAGIARIO`↔`ESTAGIO`, etc.). Todo servidor tem **cargo** (`cargoId`) e **lotação** (`unidadeLotacaoId`).

- **RN-RH-011:** Servidores `EFETIVO` possuem posicionamento na carreira (`classe`/`referencia`), referenciando `FaixaSalarial`. Progressão/promoção altera o posicionamento (movimentação funcional, seção 6).

> **Paridade com o CUD:** o `TipoVinculo` do CUD ainda não tem `TEMPORARIO` — incluir lá para refletir o RH (a ajustar no schema do CUD).

---

## 5. DESIGNAÇÃO DE CARGO DE CONFIANÇA

- `DesignacaoConfianca` (campos: `id`, `servidorId`, `cargoId?` (COMISSAO) **ou** `funcaoGratificadaId?` (FG), `unidadeId`, `atoPortaria?`, `dataInicio`, `dataFim?`, `ativo`).

- **RN-RH-012:** Um servidor **efetivo** pode **acumular** uma designação de confiança (cargo em comissão **ou** função gratificada), mantendo o vínculo efetivo. A designação tem **unidade** própria (a que ele chefia) e **período**.

- **RN-RH-013:** O titular de cargo de confiança em uma unidade é o **chefe** dessa unidade. Essa informação é repassada ao **CUD**, onde o servidor vira **responsável/`AdministradorSetor`** do setor correspondente (administração hierárquica — RN-CUD-038).

- **RN-RH-014:** A **dispensa** da confiança (`dataFim` preenchida / `ativo = false`) remove a chefia e atualiza o CUD (perde o papel de administrador do setor).

---

## 6. MOVIMENTAÇÕES FUNCIONAIS

- `MovimentacaoFuncional` (campos: `id`, `servidorId`, `tipo`, `data`, `atoPortaria?`, `unidadeOrigemId?`, `unidadeDestinoId?`, `cargoId?`, `observacao?`).

- Tipo (enum `TipoMovimentacaoFuncional`): `ADMISSAO`, `POSSE`, `NOMEACAO`, `DESIGNACAO_CONFIANCA`, `DISPENSA_CONFIANCA`, `REMOCAO`, `PROGRESSAO`, `PROMOCAO`, `LICENCA`, `AFASTAMENTO`, `CESSAO`, `EXONERACAO`, `APOSENTADORIA`, `FALECIMENTO`.

- Situação (enum `SituacaoFuncional`): `ATIVO`, `AFASTADO`, `LICENCA`, `CEDIDO`, `EXONERADO`, `APOSENTADO`.

- **RN-RH-015:** Toda alteração funcional relevante registra uma `MovimentacaoFuncional` com o respectivo **ato/portaria** (rastreabilidade legal).

- **RN-RH-016:** `EXONERACAO`, `APOSENTADORIA` e `FALECIMENTO` alteram a `situacao` e **disparam no CUD** o rebaixamento do usuário para `EXTERNO` e a revogação dos acessos internos (RN-CUD-051/054).

- **RN-RH-017:** `REMOCAO` altera a `unidadeLotacaoId` e **sincroniza** a nova lotação (setor) no CUD (`Usuario.setorId`).

---

## 7. INTEGRAÇÃO COM O CUD

- **RN-RH-018:** O RH **publica** para o CUD: a **ficha funcional** (matrícula, cargo, lotação→setor, vínculo, situação) e a **árvore de unidades** (→ `Setor`). O RH é a **fonte**; o CUD é o **consumidor**.

- **RN-RH-019:** A correlação usa `cpf` (identidade no CUD) e `rhId = Servidor.id`. O RH **não** cria login/senha — só dados funcionais; a conta de acesso é criada e gerida no **CUD**.

- **RN-RH-020:** A sincronização pode ser por **evento** (webhook a cada movimentação) ou **rotina** periódica. Mudanças que afetam acesso (vínculo, situação, lotação) devem refletir no CUD em tempo hábil.

### Mapeamento RH ↔ CUD

| RH                          | CUD                                         |
|-----------------------------|---------------------------------------------|
| `Servidor.cpf`              | `Usuario.cpf`                               |
| `Servidor.id`               | `FichaFuncional.rhId`                        |
| `Servidor.matricula`        | `FichaFuncional.matricula` / `Usuario.matricula` |
| `Servidor.cargo` (nome)     | `FichaFuncional.cargo`                       |
| `Servidor.unidadeLotacaoId` | `FichaFuncional.setorLotacaoId` / `Usuario.setorId` |
| `Servidor.tipoVinculo`      | `Usuario.tipoVinculo`                        |
| `Servidor.situacao`         | `FichaFuncional.situacaoFuncional`           |
| `UnidadeOrganizacional`     | `Setor` (árvore)                             |
| `DesignacaoConfianca` (titular) | `AdministradorSetor` / responsável do setor |

---

## 8. FREQUÊNCIA (escopo futuro)

Não modelado nesta versão. Previsto para fases seguintes:
- Registro de ponto **biométrico/digital** e **app de frequência**
- Espelho de ponto, **banco de horas**, escalas/turnos
- Abonos, justificativas e fechamento mensal

> A frequência ficará sob responsabilidade do RH e consumirá a base de servidores/lotação já definida aqui.

---

## 9. AUDITORIA

- **RN-RH-021:** Atos funcionais (admissão, nomeação, designação/dispensa de confiança, remoção, progressão/promoção, exoneração, aposentadoria e alterações de cargo/carreira) geram `LogAuditoria` **imutável**, com ator, ato/portaria e `valorAnterior`/`valorNovo`.

---

## 10. SEEDS INICIAIS RECOMENDADAS

```
TipoUnidade: SECRETARIA, DEPARTAMENTO, COORDENADORIA, SETOR

Símbolos de comissão (exemplo): CC-1..CC-6, DAS-1..DAS-3
Funções gratificadas (exemplo): FG-1..FG-4

Carreiras e cargos efetivos: carga inicial a partir da Lei do Plano de Cargos e Carreiras
  (https://leismunicipais.com.br/plano-de-cargos-e-carreiras-dourados-ms)

Unidades (exemplo): Secretaria Municipal de Fazenda (SEMFAZ), Administração (SEMAD), etc.

ConfiguracaoSistema (RH):
  - BLOQUEAR_NOMEACAO_SEM_VAGA = true
  - CUD_SYNC_URL = <url do CUD>
```

---

## Apêndice — Enums do RH

| Enum                       | Valores                                                                                          |
|----------------------------|-------------------------------------------------------------------------------------------------|
| `TipoUnidade`              | SECRETARIA, DEPARTAMENTO, COORDENADORIA, SETOR                                                   |
| `TipoCargo`                | EFETIVO, COMISSAO, FUNCAO_GRATIFICADA, ESTAGIO, TEMPORARIO, ELETIVO                              |
| `TipoVinculoFuncional`     | EFETIVO, COMISSIONADO, ESTAGIARIO, ELETIVO, TEMPORARIO                                           |
| `RegimeJuridico`           | ESTATUTARIO, CELETISTA, ESPECIAL                                                                 |
| `SituacaoFuncional`        | ATIVO, AFASTADO, LICENCA, CEDIDO, EXONERADO, APOSENTADO                                          |
| `TipoMovimentacaoFuncional`| ADMISSAO, POSSE, NOMEACAO, DESIGNACAO_CONFIANCA, DISPENSA_CONFIANCA, REMOCAO, PROGRESSAO, PROMOCAO, LICENCA, AFASTAMENTO, CESSAO, EXONERACAO, APOSENTADORIA, FALECIMENTO |

> O RH é a fonte; o CUD consome identidade + ficha funcional. Frequência é escopo futuro.

---

*Documento base para a construção do sistema de RH — Prefeitura Municipal de Dourados/MS.*
