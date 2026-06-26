-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('PROCESSO_CRIADO', 'PROCESSO_RECEBIDO', 'PROCESSO_ATUALIZADO', 'PROCESSO_TRANSFERIDO', 'PROCESSO_CONCLUIDO', 'PROCESSO_COMENTARIO', 'PAGAMENTO_PENDENTE', 'PAGAMENTO_CONFIRMADO', 'DOCUMENTO_SOLICITADO', 'PRAZO_PROXIMO_VENCIMENTO', 'PRAZO_VENCIDO', 'PENDENCIA_ABERTA', 'PENDENCIA_CUMPRIDA', 'PENDENCIA_EXPIRADA', 'DOCUMENTO_ASSINADO');

-- CreateTable
CREATE TABLE "ConfiguracaoNotificacao" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT,
    "organogramaId" TEXT,
    "tipoEvento" "TipoEvento" NOT NULL,
    "notificarCidadao" BOOLEAN NOT NULL DEFAULT false,
    "notificarUsuarioAtribuido" BOOLEAN NOT NULL DEFAULT false,
    "notificarUsuariosSetor" BOOLEAN NOT NULL DEFAULT false,
    "notificarResponsavel" BOOLEAN NOT NULL DEFAULT false,
    "notificarEmail" BOOLEAN NOT NULL DEFAULT false,
    "notificarSistema" BOOLEAN NOT NULL DEFAULT true,
    "modeloEmail" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConfiguracaoNotificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "processoId" TEXT,
    "tipoEvento" "TipoEvento" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "lidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacaoCidadao" (
    "id" TEXT NOT NULL,
    "parteInteressadaId" TEXT NOT NULL,
    "processoId" TEXT,
    "tipoEvento" "TipoEvento" NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "enviada" BOOLEAN NOT NULL DEFAULT false,
    "enviadaEm" TIMESTAMP(3),
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacaoCidadao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoNotificacao_assuntoId_organogramaId_tipoEvento_key" ON "ConfiguracaoNotificacao"("assuntoId", "organogramaId", "tipoEvento");

-- CreateIndex
CREATE INDEX "Notificacao_usuarioId_lida_idx" ON "Notificacao"("usuarioId", "lida");

-- CreateIndex
CREATE INDEX "NotificacaoCidadao_parteInteressadaId_idx" ON "NotificacaoCidadao"("parteInteressadaId");

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacaoCidadao" ADD CONSTRAINT "NotificacaoCidadao_parteInteressadaId_fkey" FOREIGN KEY ("parteInteressadaId") REFERENCES "ParteInteressada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacaoCidadao" ADD CONSTRAINT "NotificacaoCidadao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

