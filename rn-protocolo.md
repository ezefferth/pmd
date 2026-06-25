# 📋 Regras de Negócio — Sistema de Protocolo Digital (SPD)
**Prefeitura Municipal de Dourados/MS — Secretaria Municipal de Fazenda**
Versão: 2.2.0 | Stack: Next.js · Prisma ORM · PostgreSQL (Supabase Self-Hosted)

> **Convenção de nomenclatura (pt-BR):** todos os nomes de entidades, campos, flags, enums de domínio
> e permissões deste documento seguem a convenção pt-BR obrigatória do ecossistema PMD (ver `CLAUDE.md` raiz).
> As permissões no formato `MODULO:ACAO` (ex.: `PROCESSOS:CRIAR`) são o **contrato de integração** que o
> novo CUD adotará — definido em pt-BR desde a origem, sem camada de tradução entre os sistemas.

---

## 1. ORGANOGRAMA

### 1.1 Estrutura Hierárquica

- O organograma é composto por **até 5 níveis hierárquicos**, definidos genericamente na tabela `NivelOrganograma`:
  | Nível | Exemplo de nomenclatura        |
  |-------|-------------------------------|
  | 1     | Secretaria / Procuradoria      |
  | 2     | Superintendência / Tesouraria  |
  | 3     | Assessoria / Coordenadoria     |
  | 4     | Unidade / Setor                |
  | 5     | Subunidade / Subsetor          |

- Cada nó do organograma (`Organograma`) possui:
  - **Código único** (`codigo`) no formato `001.001.001.001.001` (máscara configurável por nível)
  - **Sigla/Acrônimo** (`sigla`) (ex.: `SEMFAZ`, `SUPAD`)
  - Referência ao **nó pai** (`paiId`) — auto-referência para composição da hierarquia

- **RN-001:** O código (`codigo`) deve ser único no sistema. A máscara é definida por nível e controla a formatação automática ao cadastrar novos nós.

- **RN-002:** Um nó pode ser desativado (`ativo = false`). Nós desativados não recebem novos processos e não aparecem nas listas de destino, mas os processos existentes são preservados.

### 1.2 Responsáveis e Usuários

- Cada nó pode ter **um ou mais responsáveis** (`ResponsavelOrganograma`), sendo um deles marcado como titular (`ehTitular = true`).

- **RN-003:** O responsável titular (`ehTitular = true`) é considerado o **chefe do setor**. Ele tem permissões especiais de autorização de transferência e visualização.

- **RN-004:** Um responsável pode ter a flag `podeVerSubsetores = true`, que lhe concede **visualização somente leitura** dos processos dos setores filhos (subordinados). **Ele não pode dar andamento ou responder esses processos.**

- Servidores comuns são vinculados a setores via `UsuarioOrganograma`. Um servidor pode estar em **mais de um setor**, mas terá um setor primário (`ehPrimario = true`).

### 1.3 Configuração de Atribuição

- Cada setor possui uma configuração `ConfiguracaoAtribuicaoOrganograma` com tipo de atribuição padrão (enum `TipoAtribuicao`):
  | Valor                  | Comportamento                                         |
  |------------------------|-------------------------------------------------------|
  | `RESPONSAVEL`          | Atribui ao responsável titular do setor               |
  | `ANALISTA`             | Atribui ao próximo analista disponível (round-robin)  |
  | `AUTOMATICO`           | Distribuição automática balanceada                    |
  | `TODO_SETOR`           | Qualquer usuário do setor pode atuar                  |
  | `USUARIOS_ESPECIFICOS` | Atribui apenas aos usuários listados no assunto       |

- **RN-005:** O tipo de atribuição pode ser sobrescrito por assunto específico (`Assunto.tipoAtribuicao`), que prevalece sobre a configuração do setor.

---

## 2. CONTROLE DE ACESSO

### 2.1 Perfis e Permissões

- O sistema adota controle de acesso baseado em **perfis** (`Perfil`) e **grupos** (`GrupoAcesso`).
- Um usuário tem **um perfil** e pode pertencer a **múltiplos grupos**.
- As permissões efetivas são a **união** das permissões do perfil + todos os grupos.

- **RN-006:** Permissões são definidas pela combinação `módulo × ação`, no formato string `MODULO:ACAO` (contrato de integração com o CUD, em pt-BR). Módulos disponíveis: `USUARIOS, PROCESSOS, MOVIMENTACOES, ORGANOGRAMA, ASSUNTOS, DOCUMENTOS, PAGAMENTOS, RELATORIOS, ADMIN, NOTIFICACOES, CADASTROS, AUDITORIA`.

- Ações disponíveis: `LER, CRIAR, ATUALIZAR, EXCLUIR, APROVAR, TRANSFERIR, CONCLUIR, ARQUIVAR, EXPORTAR, ATRIBUIR`.

### 2.2 Usuário Admin

- **RN-007:** Usuário com `ehAdmin = true` possui **acesso irrestrito** a todos os módulos, independente do perfil/grupos atribuídos.

- **RN-008:** Todo acesso a dados sensíveis (processos sigilosos, pareceres, dados de contribuintes) é registrado em `LogAuditoria`, inclusive por admins.

---

## 3. CADASTRO — PARTES INTERESSADAS

### 3.1 Base Cadastral (espelho Betha)

- O sistema mantém uma tabela `ParteInteressada` que é o **espelho** dos contribuintes/econômicos do sistema Betha Tributário.
- Tipos de pessoa (enum `TipoPessoa`): `PF` (Pessoa Física) e `PJ` (Pessoa Jurídica).

- **RN-009:** A migração inicial dos econômicos do Betha é feita via rotina ETL. Periodicamente (diária ou webhook), novos cadastros no Betha são sincronizados para `ParteInteressada` via `bethaId` / `bethaEconomicoId`.

### 3.2 Cadastro de Novo Contribuinte

- **RN-010:** Se o CPF do requerente não existir em `ParteInteressada`, o sistema deve criá-lo **primeiro no sistema Betha** via API (com os campos obrigatórios do Betha) e, ao obter o `bethaId`, criar o registro em `ParteInteressada`.

- **RN-011:** Campos obrigatórios para criação no Betha (via API): CPF, Nome completo, Data de nascimento, E-mail. Validar CPF (dígito verificador) antes de enviar.

- **RN-012:** Caso o Betha retorne erro (CPF inválido, duplicidade), o processo de abertura deve ser interrompido com mensagem clara ao usuário.

### 3.3 Conta Cidadão (identidade no CUD)

> **Decidido:** a central de usuários é **única**. O cidadão **não cria conta no SPD** — ele cria a
> conta no **CUD** (`tipoVinculo = EXTERNO`). Com essa conta, acessa o SPD **como cidadão** para abrir
> e acompanhar processos. O SPD **não possui** mais entidade `Citizen`; consome a identidade do CUD e
> mantém apenas o vínculo do requerente com `ParteInteressada` (espelho Betha). Ver issue #1.

- O cidadão **autoregistra a conta no CUD**. O SPD identifica o requerente pelo CPF da conta CUD e o vincula a um registro `ParteInteressada`.

- **RN-013:** Se o CPF não existir em `ParteInteressada`, o sistema aciona o fluxo de criação no Betha antes de prosseguir (RN-010).

- **RN-014:** O requerente corresponde a **uma conta única no CUD** (`EXTERNO`), associada por CPF ao `ParteInteressada`. Não há conta de cidadão duplicada no SPD.

- **RN-015:** A abertura de processos exige conta CUD com **e-mail validado**. A validação de e-mail é feita no CUD (RN-CUD-007); o SPD apenas verifica o pré-requisito.

---

## 4. ASSUNTOS

### 4.1 Código e Classificação

- O código de um assunto (`Assunto.codigo`) é um **sequencial inteiro por secretaria** (`secretariaId`). O par `(codigo, secretariaId)` é único.

- **RN-016:** Ao cadastrar um novo assunto, o sistema deve calcular automaticamente o próximo código sequencial disponível para aquela secretaria.

### 4.2 Comportamentos Configuráveis

| Flag                          | Descrição                                                          |
|-------------------------------|--------------------------------------------------------------------|
| `disponivelParaNovasAberturas`| Habilita/desabilita o assunto para novas aberturas                |
| `permiteAberturaExterna`      | Permite abertura pelo portal do cidadão                           |
| `permiteAberturaInterna`      | Permite abertura interna por servidores                           |
| `permiteAnonimo`              | Aceita abertura sem identificação do requerente                   |
| `permiteSigiloso`             | Permite marcar processo como sigiloso                             |
| `tramitarComPendenciaPagamento`| Permite tramitar mesmo com guia de pagamento pendente            |
| `exigeObservacao`             | Torna campo "observação" obrigatório em cada andamento            |
| `exigeComentarios`            | Torna campo "comentários" obrigatório em cada andamento           |
| `permiteTramitacao`           | Habilita/bloqueia qualquer tramitação no assunto                  |

### 4.3 Roteamento de Processos

- **RN-017 (Abertura Externa):** Ao abrir um processo pelo portal do cidadão, ele é automaticamente direcionado para o `organogramaDestinoId` do assunto.

- **RN-018 (Abertura Interna):** Ao abrir internamente, o processo cai diretamente no setor do servidor que o abriu (`organogramaOrigemId = organogramaAtualId`).

### 4.4 Documentos e Guias por Assunto

- **RN-019:** Cada assunto pode ter uma lista de documentos (`AssuntoDocumento`) com flag `obrigatorio`. Documentos obrigatórios devem ser anexados na abertura ou em fase específica do processo.

- **RN-020:** Cada assunto pode exigir guias de pagamento (`AssuntoGuiaPagamento`). Se `valor` for `null` na configuração do assunto, usa o `valorPadrao` do `TipoGuia`.

### 4.5 Atribuição por Assunto

- Quando `tipoAtribuicao = USUARIOS_ESPECIFICOS`, o sistema atribui apenas para os usuários listados em `AssuntoUsuarioAtribuido` no momento em que o processo chega ao setor destino.

- **RN-021:** Se `tipoAtribuicao = AUTOMATICO`, utiliza algoritmo round-robin considerando carga atual de processos dos usuários do setor. Se o setor estiver vazio de usuários ativos, atribui ao responsável titular.

### 4.6 Campos Adicionais Personalizados

- Além do formulário comum, cada assunto pode definir **campos adicionais** próprios (`CampoAdicionalAssunto`), para coletar informações que não fazem parte do formulário padrão (ex.: um texto extra exigido só por aquele assunto).

- Campos do `CampoAdicionalAssunto`: `assuntoId`, `rotulo`, `tipo` (`TipoCampo`), `placeholder?`, `obrigatorio`, `ordem`, `opcoes?` (para seleção).

- Tipos (enum `TipoCampo`): `TEXTO`, `TEXTO_LONGO`, `NUMERO`, `DATA`, `SELECAO`.

- **RN-080:** Na **criação/edição do assunto**, o gestor pode cadastrar campos adicionais, definindo rótulo, tipo, obrigatoriedade, ordem e um **placeholder** (texto de orientação de preenchimento exibido no campo vazio).

- **RN-081:** Ao abrir o processo, os campos adicionais do assunto aparecem no formulário conforme a configuração (obrigatórios bloqueiam a abertura se vazios; placeholder é exibido). Os valores preenchidos são gravados em `ProcessoCampoAdicional` (`processoId`, `campoAdicionalId`, `valor`).

---

## 5. PROCESSO

### 5.1 Numeração

- **RN-022:** O número de protocolo (`numeroProtocolo`) é composto por `numeroSequencial/ano`, formatado como `"000001/2026"` (6 dígitos com zeros à esquerda + 4 dígitos do ano).

- **RN-023:** O `numeroSequencial` é controlado pela tabela `SequenciaProtocolo` (uma linha por ano). No primeiro processo de cada ano, verifica se o registro do ano existe; se não, cria com `ultimaSequencia = 1`. Incremento deve ser atômico (`SELECT ... FOR UPDATE` ou função PostgreSQL) para evitar duplicidade em ambiente concorrente.

- **RN-024:** O sequencial **reseta para 1 a cada 1º de janeiro**. O campo `ano` garante unicidade do protocolo mesmo após o reset.

### 5.2 Abertura de Processo

**Fluxo de abertura externa (cidadão) — seleção em cascata:**
1. Cidadão autenticado (conta CUD `EXTERNO`, e-mail validado) seleciona o **local da solicitação** (secretaria)
2. Seleciona o **assunto** vinculado àquela secretaria (`disponivelParaNovasAberturas = true AND permiteAberturaExterna = true`)
3. Informa o **motivo da solicitação** (`Process.motivo`)
4. Sistema exibe os **campos obrigatórios**: dados do cidadão (pré-preenchidos do CUD) + campos adicionais do assunto (RN-080/081)
5. Sistema valida documentos obrigatórios (`AssuntoDocumento.obrigatorio = true`)
6. Sistema verifica se há guias obrigatórias (`AssuntoGuiaPagamento.obrigatorio = true`)
7. Se `tramitarComPendenciaPagamento = false` e há guia pendente → bloqueia abertura
8. Gera `numeroProtocolo` (RN-022/023)
9. Cria lançamento no Betha via API (campo `bethaLancamentoId`)
10. Direciona para `organogramaDestinoId`
11. Aplica lógica de atribuição do assunto (RN-021)
12. Registra `MovimentacaoProcesso` tipo `CRIADO`
13. Dispara notificações configuradas

**RN-082 (seleção em cascata):** A abertura externa segue a ordem **secretaria → assunto → motivo**. Só aparecem assuntos da secretaria escolhida com `permiteAberturaExterna = true` e `disponivelParaNovasAberturas = true`.

**RN-083 (dados do cidadão pré-preenchidos do CUD):** O formulário traz os dados do cidadão vindos da **conta CUD**, pré-preenchidos:
- **Obrigatórios:** nome, CPF, e-mail (já validado), CEP, estado, município, endereço.
- **Opcionais:** RG, órgão emissor, data de emissão, UF de emissão, sexo, data de nascimento, e-mail secundário, telefone, telefone secundário.

**RN-084 (edição e dado-mestre no CUD):** Todos os campos pré-preenchidos são **editáveis no formulário, exceto o e-mail**. Para alterar **e-mail** (chave de identidade) — e os demais dados-mestre de contato — o cidadão acessa o **CUD** e revalida (novo e-mail exige nova validação, RN-CUD-007). Ajustes feitos no formulário valem para a solicitação/`ParteInteressada`; a fonte de verdade da identidade é o CUD.

**RN-085 (campos adicionais no formulário):** Entre os campos exibidos no passo 4, constam os **campos adicionais personalizados** do assunto, respeitando obrigatoriedade e placeholder (RN-080/081).

**RN-025:** Abertura por **Pessoa Jurídica** não é permitida diretamente. A PJ deve ser inserida como parte interessada (`ProcessoInteressado`), sendo o requerente sempre uma PF.

**RN-026:** Processos anônimos (`ehAnonimo = true`) só são permitidos se `Assunto.permiteAnonimo = true`. Nesses casos, o `requerenteId` pode ser nulo ou apontar para uma `ParteInteressada` genérica/anônima.

### 5.3 Bloqueio e Transferência

- **RN-027:** Ao atribuir um processo a um servidor (`usuarioAtribuidoId`), o sistema seta `estaBloqueado = true`. Enquanto bloqueado:
  - Somente o `usuarioAtribuido` pode dar andamento, emitir pareceres, concluir ou arquivar.
  - Outros usuários do setor podem **visualizar** o processo, mas não agir.

- **RN-028 (Transferência pelo Servidor):** O `usuarioAtribuido` pode transferir o processo para outro setor ou usuário sem restrições, desde que tenha permissão `PROCESSOS:TRANSFERIR`.

- **RN-029 (Transferência pelo Chefe com Autorização):** O responsável titular do setor pode transferir um processo bloqueado a outro servidor mediante:
  1. Inserir a própria senha (`autorizadoPorUsuarioId` + autenticação)
  2. Informar `observacaoAutorizacao` (justificativa obrigatória)
  3. O sistema registra a `MovimentacaoProcesso` com os campos de autorização preenchidos.

### 5.4 Status e Ciclo de Vida

Enum `StatusProcesso`:

```
                         ┌──────────┐
           (abertura)    │  ABERTO  │
           ──────────►   └──────────┘
                              │ recebimento
                              ▼
                        ┌──────────┐
                        │ RECEBIDO │◄──────────────────┐
                        └──────────┘                   │
                              │                        │ reabertura
                              ▼                        │
                        ┌───────────┐                  │
                        │ EM_ANALISE│                  │
                        └───────────┘                  │
                              │                        │
               ┌──────────────┼──────────────────┐     │
               ▼              ▼                  ▼     │
       ┌────────────┐ ┌──────────────────┐ ┌──────────────────┐
       │EM_ANDAMENTO│ │AGUARDANDO_DOCUMEN│ │AGUARDANDO_PAGAMEN│
       └────────────┘ └──────────────────┘ └──────────────────┘
               │              │                  │
               └──────────────┼──────────────────┘
                              │ transferência
                              ▼
                       ┌─────────────┐
                       │ TRANSFERIDO │──────────► RECEBIDO (novo setor)
                       └─────────────┘
                              │ conclusão
                              ▼
                        ┌──────────┐
                        │ CONCLUIDO│──► ARQUIVADO ──► (fim)
                        └──────────┘
                              │ cancelamento
                              ▼
                        ┌──────────┐
                        │ CANCELADO│ (fim)
                        └──────────┘
```

- **RN-030:** Processos `CONCLUIDO` podem ser arquivados (`ARQUIVADO`). Processos arquivados são somente-leitura.

- **RN-031:** Processos podem ser **reabertos** por usuário com permissão `PROCESSOS:APROVAR`, revertendo de `CONCLUIDO` ou `ARQUIVADO` para `RECEBIDO`.

- **RN-032:** O cancelamento (`CANCELADO`) é irreversível por usuários comuns. Somente admins podem reabrir processos cancelados.

### 5.5 Integração com o Sistema Betha

- **RN-033:** Na abertura de qualquer processo, o sistema realiza um lançamento no cadastro do contribuinte do Betha via API, utilizando o CPF do `requerente`. O `bethaLancamentoId` retornado é armazenado em `Processo`.

- **RN-034:** Ao emitir guias de pagamento, o sistema gera o lançamento no Betha (`GuiaPagamento.bethaLancamentoId`) e armazena o código da guia Betha (`bethaCodigoGuia`) para consulta e baixa automática.

- **RN-035:** A confirmação de pagamento pode ser feita manualmente pelo servidor ou automaticamente via webhook/rotina de integração com o Betha (status → `PAGA`).

---

## 6. MOVIMENTAÇÃO E TRAMITAÇÃO

### 6.1 Tipos de Movimentação

Enum `TipoMovimentacao`:

| Valor                | Quando                                      | Status resultante       |
|----------------------|---------------------------------------------|-------------------------|
| `CRIADO`             | Criação do processo                         | ABERTO                  |
| `RECEBIDO`           | Setor recebe o processo                     | RECEBIDO                |
| `ANALISE`            | Servidor inicia análise                     | EM_ANALISE              |
| `ANDAMENTO`          | Despacho / Andamento                        | EM_ANDAMENTO            |
| `TRANSFERENCIA`      | Transferência para outro setor              | TRANSFERIDO             |
| `DEVOLUCAO`          | Devolução ao setor anterior                 | TRANSFERIDO             |
| `PARECER`            | Parecer (conclusivo ou não)                 | EM_ANDAMENTO/CONCLUIDO  |
| `COMENTARIO`         | Comentário informativo                      | (sem alteração)         |
| `JUNTADA_DOCUMENTO`  | Juntada de documento                        | (sem alteração)         |
| `REGISTRO_PAGAMENTO` | Registro de pagamento                       | (sem alteração)         |
| `CONCLUSAO`          | Conclusão final do processo                 | CONCLUIDO               |
| `ARQUIVAMENTO`       | Arquivamento                                | ARQUIVADO               |
| `REABERTURA`         | Reabertura                                  | RECEBIDO                |
| `CANCELAMENTO`       | Cancelamento                                | CANCELADO               |
| `APENSAMENTO`        | Apensamento de processo (RN-061)            | (sem alteração)         |
| `DESAPENSAMENTO`     | Desapensamento (RN-061)                      | (sem alteração)         |
| `ANEXACAO`           | Anexação definitiva de processo (RN-062)    | (sem alteração)         |
| `ASSINATURA`         | Assinatura eletrônica/digital (RN-065)      | (sem alteração)         |
| `DESENTRANHAMENTO`   | Remoção de peça dos autos (RN-071)          | (sem alteração)         |
| `SOLICITACAO_PENDENCIA` | Solicitação ao cidadão (RN-072)          | AGUARDANDO_DOCUMENTOS / AGUARDANDO_PAGAMENTO |
| `CUMPRIMENTO_PENDENCIA` | Cidadão atende pendência (RN-073)        | RECEBIDO                |
| `PRORROGACAO_PRAZO`  | Prorrogação de prazo de pendência (RN-075)  | (sem alteração)         |

### 6.2 Pareceres

- **RN-036:** Pareceres (`tipoMovimentacao = PARECER`) devem seguir estrutura HTML padronizada no campo `textoParecer`. O sistema pode oferecer templates pré-configurados.

- **RN-037:** Um parecer marcado como `ehConclusivo = true` é o **parecer conclusivo** do processo. Ao emiti-lo, o status é alterado para `CONCLUIDO`.

- **RN-038:** Pareceres conclusivos **não podem ser editados** após emissão. Apenas o admin pode excluir em casos excepcionais (com registro em auditoria).

### 6.3 Visibilidade

- **RN-039:** O campo `ehPublico` dos comentários e o tipo de movimento determinam o que o cidadão pode ver no portal. Movimentos internos e comentários com `ehPublico = false` ficam ocultos para o cidadão.

- **RN-040:** Processos sigilosos (`ehSigiloso = true`) são visíveis apenas para: o requerente (cidadão), o servidor atribuído, o chefe do setor e admins.

---

## 7. DOCUMENTOS

### 7.1 Upload e Validação

- **RN-041:** No upload de documentos, o sistema valida:
  - Formato do arquivo (deve estar em `TipoDocumento.formatosPermitidos`)
  - Tamanho máximo (`TipoDocumento.tamanhoMaximoMb`)

- **RN-042:** Documentos são armazenados no Supabase Storage. O campo `urlArquivo` armazena o path relativo no bucket configurado.

### 7.2 Documentos Obrigatórios

- **RN-043:** Na abertura de um processo, o sistema verifica se todos os documentos obrigatórios do assunto foram anexados. Se algum estiver faltando, a abertura é bloqueada.

- **RN-044:** Durante a tramitação, o servidor pode solicitar documentos adicionais ao cidadão (movimento que leva ao status `AGUARDANDO_DOCUMENTOS`). O processo fica aguardando até que o cidadão os anexe.

---

## 8. PAGAMENTOS E GUIAS

- **RN-045:** Guias de pagamento (`GuiaPagamento`) são geradas automaticamente na abertura do processo quando o assunto tem `AssuntoGuiaPagamento` configurada.

- **RN-046:** Se `tramitarComPendenciaPagamento = false` no assunto, qualquer tentativa de movimentação enquanto houver guia com status `PENDENTE` ou `VENCIDA` é bloqueada, exibindo mensagem ao servidor.

- **RN-047:** Guias vencem automaticamente (`status → VENCIDA`) por rotina agendada que executa diariamente, comparando `dataVencimento` com a data atual.

---

## 9. NOTIFICAÇÕES

### 9.1 Configuração por Evento

- **RN-048:** As notificações são configuradas em `ConfiguracaoNotificacao` por `(assuntoId, organogramaId, tipoEvento)`. Configurações com `assuntoId = null` e `organogramaId = null` se aplicam a todos os processos.

- **Eventos disponíveis (enum `TipoEvento`):** `PROCESSO_CRIADO, PROCESSO_RECEBIDO, PROCESSO_ATUALIZADO, PROCESSO_TRANSFERIDO, PROCESSO_CONCLUIDO, PROCESSO_COMENTARIO, PAGAMENTO_PENDENTE, PAGAMENTO_CONFIRMADO, DOCUMENTO_SOLICITADO`.

### 9.2 Destinatários

| Flag                       | Destinatário                            |
|----------------------------|-----------------------------------------|
| `notificarCidadao`         | Cidadão requerente (portal + e-mail)    |
| `notificarUsuarioAtribuido`| Servidor atribuído ao processo          |
| `notificarUsuariosSetor`   | Todos os usuários do setor atual        |
| `notificarResponsavel`     | Responsável titular do setor            |
| `notificarEmail`           | Enviar também por e-mail                |
| `notificarSistema`         | Notificação interna no sistema          |

- **RN-049:** Notificações para cidadãos são armazenadas em `NotificacaoCidadao` e enviadas por e-mail (template configurável em `modeloEmail`).

- **RN-050:** Notificações de sistema ficam armazenadas em `Notificacao` e são marcadas como lidas individualmente.

---

## 10. AUDITORIA

- **RN-051:** **Todo** `CREATE`, `UPDATE`, `DELETE` em entidades críticas (`Processo`, `MovimentacaoProcesso`, `Usuario`, `Assunto`, `Organograma`, `GuiaPagamento`) gera um registro em `LogAuditoria` com `valorAnterior` e `valorNovo` em JSON.

- **RN-052:** O log de auditoria é **imutável**. Nenhum usuário (inclusive admin) pode alterar ou excluir registros de `LogAuditoria`.

- **RN-053:** O log deve registrar: `enderecoIp` e `userAgent` da requisição, identificação do ator (`usuarioId` ou `cidadaoId`), entidade e ID afetados.

---

## 11. RELATÓRIOS

- **RN-054:** O sistema deve disponibilizar relatórios gerenciais, mínimo incluindo:
  - Processos por período, status, assunto, setor
  - Tempo médio de tramitação por assunto/setor
  - Processos em aberto por setor (workload)
  - Histórico de movimentações
  - Guias emitidas x quitadas por período

- **RN-055:** Relatórios devem ser exportáveis em PDF e XLSX. O acesso é controlado pela permissão `RELATORIOS:EXPORTAR`.

---

## 12. VALIDAÇÕES GERAIS DA INTEGRAÇÃO BETHA

| Validação                    | Regra                                                              |
|------------------------------|--------------------------------------------------------------------|
| CPF                          | Dígito verificador + não nulo para PF                              |
| Nome                         | Mínimo 5 caracteres, não nulo                                      |
| Contribuinte já existe       | Buscar por `bethaId` antes de criar novo                           |
| Falha na API Betha           | Abortar abertura do processo com rollback e mensagem de erro       |
| Timeout Betha                | Retry automático (3 tentativas com backoff exponencial)            |
| Guia não encontrada          | Log de erro + notificação para admin                               |

---

## 13. SEEDS INICIAIS RECOMENDADAS

```
NivelOrganograma: Secretaria (1), Superintendência (2), Assessoria (3), Unidade (4), Subunidade (5)

Perfis padrão: Admin, Gestor, Analista, Servidor, Consulta

Permissões padrão: todos os 12 módulos × 10 ações (120 registros) — strings MODULO:ACAO em pt-BR

ConfiguracaoSistema:
  - TAMANHO_MAXIMO_ARQUIVO_MB = 10
  - TAMANHO_PREENCHIMENTO_PROTOCOLO = 6
  - BETHA_API_URL = <url>
  - BETHA_API_TIMEOUT_MS = 5000
  - SMTP_HOST, SMTP_PORT, SMTP_USER
  - NOTIFICATION_EMAIL_FROM = protocolo@dourados.ms.gov.br
```

---

## 14. PRAZOS E SLA

### 14.1 Prazo Legal por Assunto

- Cada assunto pode definir prazo legal de atendimento:
  | Campo (`Assunto`)      | Tipo / Enum             | Descrição                                              |
  |------------------------|-------------------------|--------------------------------------------------------|
  | `prazoLegalDias`       | `int?`                  | Prazo de atendimento. `null` = sem prazo definido      |
  | `tipoContagemPrazo`    | `TipoContagemPrazo`     | `DIAS_UTEIS` ou `DIAS_CORRIDOS`                         |

- **RN-056:** Ao abrir o processo, o sistema calcula `Processo.dataLimite` a partir de `prazoLegalDias` e `tipoContagemPrazo`. Se `prazoLegalDias = null`, o processo não tem `dataLimite` (não entra no controle de SLA).

- **RN-057:** Em `DIAS_UTEIS`, a contagem exclui sábados, domingos e os feriados cadastrados em `FeriadoMunicipal` (campos: `data`, `descricao`, `ehRecorrente`). Feriados recorrentes (`ehRecorrente = true`) valem todo ano na mesma data (dia/mês).

### 14.2 Suspensão e Alertas

- **RN-058:** A contagem do prazo é **suspensa** enquanto houver pendência aberta com o cidadão (`PendenciaProcesso.status = ABERTA`, ver RN-072). O tempo em pendência não conta para `dataLimite`, que é recalculada no cumprimento ou expiração da pendência.

- **RN-059:** O sistema dispara alertas automáticos ao atingir **50%, 80% e 100%** do prazo, via eventos `PRAZO_PROXIMO_VENCIMENTO` e `PRAZO_VENCIDO` (`TipoEvento`), notificando o servidor atribuído e o responsável do setor.

- **RN-060:** Processos com `dataLimite < hoje` e não concluídos são marcados como `estaAtrasado = true` (campo derivado por rotina diária) e destacados no relatório de SLA (RN-054).

---

## 15. APENSAMENTO E JUNTADA DE PROCESSOS

- Processos relacionados são vinculados via `ProcessoVinculo` (campos: `processoPrincipalId`, `processoVinculadoId`, `tipoVinculo`, `motivo`, `criadoPorId`, `dataVinculo`, `ativo`).

- Tipos de vínculo (enum `TipoVinculo`):
  | Valor        | Efeito                                                                                  |
  |--------------|-----------------------------------------------------------------------------------------|
  | `APENSO`     | Tramitação conjunta temporária; cada processo mantém número e autonomia                 |
  | `ANEXACAO`   | Incorporação definitiva do acessório ao principal; o acessório perde autonomia          |
  | `REFERENCIA` | Vínculo apenas informativo; nenhum efeito sobre a tramitação                             |

- **RN-061 (Apensamento):** No `APENSO`, os processos passam a tramitar juntos, mas cada um **mantém seu `numeroProtocolo` e ciclo de vida próprio**. Podem ser **desapensados** a qualquer momento. Registra `MovimentacaoProcesso` tipo `APENSAMENTO` / `DESAPENSAMENTO` nos dois processos.

- **RN-062 (Anexação):** Na `ANEXACAO`, o processo acessório é incorporado em definitivo ao principal, passa a `ARQUIVADO` e **não tramita mais isoladamente**. Toda a movimentação posterior ocorre no processo principal. Registra `MovimentacaoProcesso` tipo `ANEXACAO`. Operação **irreversível** por usuário comum (somente admin desfaz, com registro em auditoria).

- **RN-063 (Referência):** O `REFERENCIA` é um vínculo informativo bidirecional, sem qualquer efeito sobre status ou tramitação.

- **RN-064:** Não é permitido vincular um processo a si mesmo, nem criar vínculo `ANEXACAO` em processo já `ARQUIVADO`/`CANCELADO`. O sistema impede ciclos de anexação (A→B→A).

---

## 16. ASSINATURA ELETRÔNICA E DIGITAL

- Assinaturas ficam em `AssinaturaDocumento` (campos: `documentoId` **ou** `movimentacaoId`, `signatarioId`, `tipoAssinatura`, `hashDocumento`, `codigoVerificacao`, `carimboTempo`, `dataAssinatura`, `ativo`).

- Tipos (enum `TipoAssinatura`):
  | Valor                | Mecanismo                                                          |
  |----------------------|--------------------------------------------------------------------|
  | `ELETRONICA_SIMPLES` | Autenticação do servidor (login/senha) + carimbo de tempo          |
  | `GOV_BR`             | Assinatura via integração gov.br (Assinatura Eletrônica)           |
  | `ICP_BRASIL`         | Certificado digital ICP-Brasil (A1/A3)                             |

- **RN-065:** **Pareceres conclusivos** (`ehConclusivo = true`) e documentos oficiais emitidos pelo sistema **exigem assinatura** para produzir efeito. Sem assinatura válida, o parecer não conclui o processo.

- **RN-066:** No momento da assinatura, o sistema gera o `hashDocumento` (SHA-256) do conteúdo. O documento/parecer assinado torna-se **imutável**; qualquer alteração posterior invalida a assinatura (hash divergente).

- **RN-067:** Cada assinatura gera um `codigoVerificacao` único. O sistema expõe uma **página pública de verificação** que, pelo código, confirma autenticidade, signatário, data e integridade (comparação de hash).

- **RN-068:** Assinatura `ICP_BRASIL` e `GOV_BR` dependem de integração externa; em falha, a assinatura não é registrada e o usuário é avisado (sem efeito parcial). Registra `MovimentacaoProcesso` tipo `ASSINATURA` e evento `DOCUMENTO_ASSINADO`.

---

## 17. NUMERAÇÃO DE PEÇAS E FOLHAS

- Cada documento/parecer juntado ao processo é uma **peça processual**. Campos adicionados ao documento: `numeroOrdem` (sequencial da peça no processo), `numeroFolhaInicial`, `numeroFolhaFinal`.

- **RN-069:** Cada peça recebe `numeroOrdem` **sequencial e contínuo** dentro do processo, na ordem de juntada. O número é **imutável** e não é reaproveitado.

- **RN-070:** A numeração de **folhas** é contínua entre as peças: `numeroFolhaInicial`/`numeroFolhaFinal` são calculados pela quantidade de páginas do PDF da peça anterior. Ex.: peça 1 (fls. 1–3), peça 2 (fls. 4–7).

- **RN-071 (Desentranhamento):** A remoção de uma peça dos autos exige despacho justificado e permissão `DOCUMENTOS:EXCLUIR` (ou admin). O número da peça **não é reaproveitado**; o sistema insere um **termo de desentranhamento** no lugar e registra `MovimentacaoProcesso` tipo `DESENTRANHAMENTO` + `LogAuditoria`.

---

## 18. PENDÊNCIAS E RETORNO DO CIDADÃO

- Solicitações ao cidadão são controladas por `PendenciaProcesso` (campos: `processoId`, `tipo`, `descricao`, `prazoCidadaoDias`, `dataAbertura`, `dataLimite`, `status`, `criadoPorId`, `cumpridaEm`).

- Tipo (enum `TipoPendencia`): `DOCUMENTO`, `PAGAMENTO`, `INFORMACAO`.
- Status (enum `StatusPendencia`): `ABERTA`, `CUMPRIDA`, `EXPIRADA`, `CANCELADA`.

- **RN-072:** Ao solicitar documento/pagamento/informação, o sistema abre uma `PendenciaProcesso` com `prazoCidadaoDias`, move o processo para `AGUARDANDO_DOCUMENTOS` ou `AGUARDANDO_PAGAMENTO` e **suspende a contagem do prazo interno** (RN-058). Registra `MovimentacaoProcesso` tipo `SOLICITACAO_PENDENCIA` e evento `PENDENCIA_ABERTA`.

- **RN-073:** O cidadão é notificado (portal + e-mail). Ao atender (upload do documento / confirmação de pagamento), a pendência passa a `CUMPRIDA`, o processo **retorna ao servidor** (`RECEBIDO`/`EM_ANDAMENTO`) e a **contagem do prazo é retomada**. Registra `CUMPRIMENTO_PENDENCIA` e evento `PENDENCIA_CUMPRIDA`.

- **RN-074:** Se `dataLimite < hoje` sem cumprimento, a pendência passa a `EXPIRADA` (rotina diária). Conforme configuração do assunto, o sistema **arquiva por inércia** (`ARQUIVADO`) ou notifica o servidor para decisão. Dispara evento `PENDENCIA_EXPIRADA`.

- **RN-075:** O cidadão só pode cumprir pendências da **própria conta** (`Cidadao` vinculada ao `requerente`). O servidor pode **prorrogar** o prazo (`PRORROGACAO_PRAZO`), registrando justificativa.

---

## 19. SIGILO E PERMISSÃO A NÍVEL DE DADO

- O sigilo do processo passa a ser graduado por `Processo.nivelSigilo` (enum `NivelSigilo`), em vez de um único booleano:
  | Nível       | Quem visualiza                                                                 |
  |-------------|--------------------------------------------------------------------------------|
  | `PUBLICO`   | Qualquer um (inclusive consulta no portal)                                     |
  | `RESTRITO`  | Servidores com acesso ao setor onde o processo tramita                         |
  | `SIGILOSO`  | Requerente, servidor atribuído, chefe do setor e admins (RN-040)               |
  | `SECRETO`   | Somente usuários **credenciados nominalmente** + admins                        |

- **RN-076:** `nivelSigilo` substitui o antigo `ehSigiloso`. Para compatibilidade, `ehSigiloso` é derivado: `true` quando `nivelSigilo >= SIGILOSO`. O nível só pode ser elevado em assuntos com `permiteSigiloso = true`.

- **RN-077:** A visibilidade segue a tabela acima. Em `RESTRITO`, perde-se a visibilidade ao transferir o processo para outro setor (a credencial é do setor, não nominal).

- **RN-078 (Permissão a nível de dado):** O acesso **nominal** a um processo sigiloso/secreto é concedido por `CredencialAcessoProcesso` (campos: `processoId`, `usuarioId`, `concedidoPorId`, `motivo`, `dataConcessao`, `ativo`). Concedida pelo chefe do setor ou admin, **independe do setor** do servidor e pode ser **revogada** (`ativo = false`).

- **RN-079:** Toda **visualização** de processo `SIGILOSO` ou `SECRETO` — concedida ou negada — gera `LogAuditoria` (estende RN-008), registrando ator, processo, resultado (acesso/negado) e credencial utilizada.

---

## Apêndice — Mapa de nomenclatura (legado EN → pt-BR)

> Referência rápida para quem migra da versão 1.0.0 (inglês) deste documento.

### Entidades / Tabelas
| Inglês (v1)              | pt-BR (v2)                          |
|--------------------------|-------------------------------------|
| `OrganogramLevel`        | `NivelOrganograma`                  |
| `Organogram`             | `Organograma`                       |
| `OrganogramResponsible`  | `ResponsavelOrganograma`            |
| `UserOrganogram`         | `UsuarioOrganograma`                |
| `OrganogramAssignmentConfig` | `ConfiguracaoAtribuicaoOrganograma` |
| `Profile`                | `Perfil`                            |
| `AccessGroup`            | `GrupoAcesso`                       |
| `Party`                  | `ParteInteressada`                  |
| `Citizen`                | ~~`Cidadao`~~ **descontinuado** — identidade no CUD (issue #1) |
| `Subject`                | `Assunto`                           |
| `SubjectDocument`        | `AssuntoDocumento`                  |
| `SubjectPaymentGuide`    | `AssuntoGuiaPagamento`              |
| `SubjectAssignedUser`    | `AssuntoUsuarioAtribuido`           |
| `GuideType`              | `TipoGuia`                          |
| `Process`                | `Processo`                          |
| `ProtocolSequence`       | `SequenciaProtocolo`                |
| `ProcessMovement`        | `MovimentacaoProcesso`              |
| `ProcessInterestedParty` | `ProcessoInteressado`               |
| `PaymentGuide`           | `GuiaPagamento`                     |
| `DocumentType`           | `TipoDocumento`                     |
| `NotificationConfig`     | `ConfiguracaoNotificacao`           |
| `CitizenNotification`    | `NotificacaoCidadao`                |
| `Notification`           | `Notificacao`                       |
| `AuditLog`               | `LogAuditoria`                      |
| `SystemConfig`           | `ConfiguracaoSistema`               |
| `User`                   | `Usuario`                           |

### Novas entidades (v2.1)
`FeriadoMunicipal`, `ProcessoVinculo`, `AssinaturaDocumento`, `PendenciaProcesso`, `CredencialAcessoProcesso`.
Novos campos: `Assunto.prazoLegalDias`, `Assunto.tipoContagemPrazo`, `Processo.dataLimite`, `Processo.estaAtrasado`, `Processo.nivelSigilo`, e em documento `numeroOrdem` / `numeroFolhaInicial` / `numeroFolhaFinal`.

### Novas entidades (v2.2)
`CampoAdicionalAssunto`, `ProcessoCampoAdicional`. Novo campo: `Processo.motivo`.
Identidade do cidadão **descontinuada no SPD** — consumida do CUD (`tipoVinculo = EXTERNO`, issue #1).

### Enums de domínio
| Inglês (v1)        | pt-BR (v2)                                                                                          |
|--------------------|----------------------------------------------------------------------------------------------------|
| AssignmentType     | `TipoAtribuicao`: RESPONSAVEL, ANALISTA, AUTOMATICO, TODO_SETOR, USUARIOS_ESPECIFICOS               |
| ProcessStatus      | `StatusProcesso`: ABERTO, RECEBIDO, EM_ANALISE, EM_ANDAMENTO, AGUARDANDO_DOCUMENTOS, AGUARDANDO_PAGAMENTO, TRANSFERIDO, CONCLUIDO, ARQUIVADO, CANCELADO |
| MovementType       | `TipoMovimentacao`: CRIADO, RECEBIDO, ANALISE, ANDAMENTO, TRANSFERENCIA, DEVOLUCAO, PARECER, COMENTARIO, JUNTADA_DOCUMENTO, REGISTRO_PAGAMENTO, CONCLUSAO, ARQUIVAMENTO, REABERTURA, CANCELAMENTO, APENSAMENTO, DESAPENSAMENTO, ANEXACAO, ASSINATURA, DESENTRANHAMENTO, SOLICITACAO_PENDENCIA, CUMPRIMENTO_PENDENCIA, PRORROGACAO_PRAZO |
| GuideStatus        | `StatusGuia`: PENDENTE, VENCIDA, PAGA                                                               |
| EventType          | `TipoEvento`: PROCESSO_CRIADO, PROCESSO_RECEBIDO, PROCESSO_ATUALIZADO, PROCESSO_TRANSFERIDO, PROCESSO_CONCLUIDO, PROCESSO_COMENTARIO, PAGAMENTO_PENDENTE, PAGAMENTO_CONFIRMADO, DOCUMENTO_SOLICITADO, PRAZO_PROXIMO_VENCIMENTO, PRAZO_VENCIDO, PENDENCIA_ABERTA, PENDENCIA_CUMPRIDA, PENDENCIA_EXPIRADA, DOCUMENTO_ASSINADO |
| PersonType         | `TipoPessoa`: PF, PJ                                                                                |
| —                  | `TipoContagemPrazo`: DIAS_UTEIS, DIAS_CORRIDOS                                                      |
| —                  | `TipoVinculo`: APENSO, ANEXACAO, REFERENCIA                                                         |
| —                  | `TipoAssinatura`: ELETRONICA_SIMPLES, GOV_BR, ICP_BRASIL                                            |
| —                  | `TipoPendencia`: DOCUMENTO, PAGAMENTO, INFORMACAO                                                   |
| —                  | `StatusPendencia`: ABERTA, CUMPRIDA, EXPIRADA, CANCELADA                                            |
| —                  | `NivelSigilo`: PUBLICO, RESTRITO, SIGILOSO, SECRETO                                                 |
| —                  | `TipoCampo`: TEXTO, TEXTO_LONGO, NUMERO, DATA, SELECAO                                              |

### Permissões (`MODULO:ACAO`) — agora em pt-BR
| Inglês (v1) | pt-BR (v2)                                                                                            |
|-------------|-----------------------------------------------------------------------------------------------------|
| Módulos     | `USUARIOS, PROCESSOS, MOVIMENTACOES, ORGANOGRAMA, ASSUNTOS, DOCUMENTOS, PAGAMENTOS, RELATORIOS, ADMIN, NOTIFICACOES, CADASTROS, AUDITORIA` |
| Ações       | `LER, CRIAR, ATUALIZAR, EXCLUIR, APROVAR, TRANSFERIR, CONCLUIR, ARQUIVAR, EXPORTAR, ATRIBUIR`        |

> O formato `MODULO:ACAO` em pt-BR é o **contrato de integração** que o novo CUD adotará.

---

*Documento gerado com base na engenharia reversa do sistema Betha e nos requisitos da Prefeitura Municipal de Dourados/MS.*
