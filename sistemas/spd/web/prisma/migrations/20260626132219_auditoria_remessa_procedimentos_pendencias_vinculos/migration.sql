-- CreateEnum
CREATE TYPE "TipoOperacaoAuditoria" AS ENUM ('INSERCAO', 'ATUALIZACAO', 'EXCLUSAO', 'LEITURA');

-- CreateEnum
CREATE TYPE "StatusGuiaRemessa" AS ENUM ('ABERTA', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "TipoModeloDocumento" AS ENUM ('DESPACHO', 'PARECER', 'CAPA', 'OFICIO', 'TERMO');

-- CreateEnum
CREATE TYPE "TipoPendencia" AS ENUM ('DOCUMENTO', 'PAGAMENTO', 'INFORMACAO');

-- CreateEnum
CREATE TYPE "StatusPendencia" AS ENUM ('ABERTA', 'CUMPRIDA', 'EXPIRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoVinculo" AS ENUM ('APENSO', 'ANEXACAO', 'REFERENCIA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoMovimentacao" ADD VALUE 'REMESSA';
ALTER TYPE "TipoMovimentacao" ADD VALUE 'RECEPCAO';

-- AlterTable
ALTER TABLE "Assunto" ADD COLUMN     "seguirProcedimento" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "hashArquivo" TEXT,
ADD COLUMN     "movimentacaoId" TEXT,
ADD COLUMN     "tamanhoBytes" INTEGER;

-- AlterTable
ALTER TABLE "Processo" ADD COLUMN     "arquivoFisicoCaixa" TEXT,
ADD COLUMN     "arquivoFisicoGaveta" TEXT,
ADD COLUMN     "arquivoFisicoPrateleira" TEXT,
ADD COLUMN     "codigoConsultaPublica" TEXT;

-- AlterTable
ALTER TABLE "UsuarioOrganograma" ADD COLUMN     "podeRecepcionar" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProcedimentoAssunto" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "organogramaId" TEXT,
    "prazoDias" INTEGER,

    CONSTRAINT "ProcedimentoAssunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessoProcedimento" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "procedimentoId" TEXT NOT NULL,
    "executado" BOOLEAN NOT NULL DEFAULT false,
    "executadoEm" TIMESTAMP(3),
    "executadoPorId" TEXT,

    CONSTRAINT "ProcessoProcedimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuiaRemessa" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "organogramaOrigemId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "status" "StatusGuiaRemessa" NOT NULL DEFAULT 'ABERTA',
    "finalizadaEm" TIMESTAMP(3),
    "finalizadaPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuiaRemessa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuiaRemessaItem" (
    "id" TEXT NOT NULL,
    "guiaRemessaId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "organogramaDestinoId" TEXT NOT NULL,
    "usuarioDestinoId" TEXT,
    "despacho" TEXT,
    "prazoDias" INTEGER,
    "recebidoEm" TIMESTAMP(3),
    "recebidoPorId" TEXT,
    "visto" TEXT,

    CONSTRAINT "GuiaRemessaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloDocumento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoModeloDocumento" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModeloDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL,
    "tabela" TEXT NOT NULL,
    "chaveRegistro" TEXT NOT NULL,
    "operacao" "TipoOperacaoAuditoria" NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT,
    "enderecoIp" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAuditoriaItem" (
    "id" TEXT NOT NULL,
    "auditoriaId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,

    CONSTRAINT "LogAuditoriaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoAuditoria" (
    "id" TEXT NOT NULL,
    "tabela" TEXT NOT NULL,
    "nomeAmigavel" TEXT NOT NULL,
    "auditarInsercao" BOOLEAN NOT NULL DEFAULT true,
    "auditarAtualizacao" BOOLEAN NOT NULL DEFAULT true,
    "auditarExclusao" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConfiguracaoAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoSistema" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssuntoUsuarioAtribuido" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "AssuntoUsuarioAtribuido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendenciaProcesso" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tipo" "TipoPendencia" NOT NULL,
    "descricao" TEXT NOT NULL,
    "prazoCidadaoDias" INTEGER NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataLimite" TIMESTAMP(3) NOT NULL,
    "status" "StatusPendencia" NOT NULL DEFAULT 'ABERTA',
    "criadoPorId" TEXT NOT NULL,
    "cumpridaEm" TIMESTAMP(3),

    CONSTRAINT "PendenciaProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessoVinculo" (
    "id" TEXT NOT NULL,
    "processoPrincipalId" TEXT NOT NULL,
    "processoVinculadoId" TEXT NOT NULL,
    "tipoVinculo" "TipoVinculo" NOT NULL,
    "motivo" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "dataVinculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProcessoVinculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcedimentoAssunto_assuntoId_ordem_key" ON "ProcedimentoAssunto"("assuntoId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoProcedimento_processoId_procedimentoId_key" ON "ProcessoProcedimento"("processoId", "procedimentoId");

-- CreateIndex
CREATE UNIQUE INDEX "GuiaRemessa_numero_key" ON "GuiaRemessa"("numero");

-- CreateIndex
CREATE INDEX "GuiaRemessaItem_processoId_idx" ON "GuiaRemessaItem"("processoId");

-- CreateIndex
CREATE INDEX "LogAuditoria_tabela_chaveRegistro_idx" ON "LogAuditoria"("tabela", "chaveRegistro");

-- CreateIndex
CREATE INDEX "LogAuditoria_usuarioId_idx" ON "LogAuditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "LogAuditoria_criadoEm_idx" ON "LogAuditoria"("criadoEm");

-- CreateIndex
CREATE INDEX "LogAuditoriaItem_auditoriaId_idx" ON "LogAuditoriaItem"("auditoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoAuditoria_tabela_key" ON "ConfiguracaoAuditoria"("tabela");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoSistema_chave_key" ON "ConfiguracaoSistema"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "AssuntoUsuarioAtribuido_assuntoId_usuarioId_key" ON "AssuntoUsuarioAtribuido"("assuntoId", "usuarioId");

-- CreateIndex
CREATE INDEX "PendenciaProcesso_processoId_idx" ON "PendenciaProcesso"("processoId");

-- CreateIndex
CREATE INDEX "ProcessoVinculo_processoVinculadoId_idx" ON "ProcessoVinculo"("processoVinculadoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoVinculo_processoPrincipalId_processoVinculadoId_tip_key" ON "ProcessoVinculo"("processoPrincipalId", "processoVinculadoId", "tipoVinculo");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_codigoConsultaPublica_key" ON "Processo"("codigoConsultaPublica");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_movimentacaoId_fkey" FOREIGN KEY ("movimentacaoId") REFERENCES "MovimentacaoProcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedimentoAssunto" ADD CONSTRAINT "ProcedimentoAssunto_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoProcedimento" ADD CONSTRAINT "ProcessoProcedimento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoProcedimento" ADD CONSTRAINT "ProcessoProcedimento_procedimentoId_fkey" FOREIGN KEY ("procedimentoId") REFERENCES "ProcedimentoAssunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuiaRemessaItem" ADD CONSTRAINT "GuiaRemessaItem_guiaRemessaId_fkey" FOREIGN KEY ("guiaRemessaId") REFERENCES "GuiaRemessa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuiaRemessaItem" ADD CONSTRAINT "GuiaRemessaItem_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAuditoriaItem" ADD CONSTRAINT "LogAuditoriaItem_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "LogAuditoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssuntoUsuarioAtribuido" ADD CONSTRAINT "AssuntoUsuarioAtribuido_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssuntoUsuarioAtribuido" ADD CONSTRAINT "AssuntoUsuarioAtribuido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendenciaProcesso" ADD CONSTRAINT "PendenciaProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoVinculo" ADD CONSTRAINT "ProcessoVinculo_processoPrincipalId_fkey" FOREIGN KEY ("processoPrincipalId") REFERENCES "Processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoVinculo" ADD CONSTRAINT "ProcessoVinculo_processoVinculadoId_fkey" FOREIGN KEY ("processoVinculadoId") REFERENCES "Processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

