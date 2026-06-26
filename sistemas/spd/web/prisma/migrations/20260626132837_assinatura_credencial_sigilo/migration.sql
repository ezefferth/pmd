-- CreateEnum
CREATE TYPE "TipoAssinatura" AS ENUM ('ELETRONICA_SIMPLES', 'GOV_BR', 'ICP_BRASIL');

-- CreateTable
CREATE TABLE "AssinaturaDocumento" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT,
    "movimentacaoId" TEXT,
    "signatarioId" TEXT NOT NULL,
    "tipoAssinatura" "TipoAssinatura" NOT NULL,
    "hashDocumento" TEXT NOT NULL,
    "codigoVerificacao" TEXT NOT NULL,
    "carimboTempo" TIMESTAMP(3),
    "dataAssinatura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AssinaturaDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredencialAcessoProcesso" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "concedidoPorId" TEXT NOT NULL,
    "motivo" TEXT,
    "dataConcessao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CredencialAcessoProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaDocumento_codigoVerificacao_key" ON "AssinaturaDocumento"("codigoVerificacao");

-- CreateIndex
CREATE INDEX "AssinaturaDocumento_documentoId_idx" ON "AssinaturaDocumento"("documentoId");

-- CreateIndex
CREATE INDEX "AssinaturaDocumento_movimentacaoId_idx" ON "AssinaturaDocumento"("movimentacaoId");

-- CreateIndex
CREATE INDEX "CredencialAcessoProcesso_processoId_idx" ON "CredencialAcessoProcesso"("processoId");

-- CreateIndex
CREATE INDEX "CredencialAcessoProcesso_usuarioId_idx" ON "CredencialAcessoProcesso"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "CredencialAcessoProcesso_processoId_usuarioId_key" ON "CredencialAcessoProcesso"("processoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "AssinaturaDocumento" ADD CONSTRAINT "AssinaturaDocumento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaDocumento" ADD CONSTRAINT "AssinaturaDocumento_movimentacaoId_fkey" FOREIGN KEY ("movimentacaoId") REFERENCES "MovimentacaoProcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredencialAcessoProcesso" ADD CONSTRAINT "CredencialAcessoProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

