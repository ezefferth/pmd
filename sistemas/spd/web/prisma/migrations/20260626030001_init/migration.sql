-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoAtribuicao" AS ENUM ('RESPONSAVEL', 'ANALISTA', 'AUTOMATICO', 'TODO_SETOR', 'USUARIOS_ESPECIFICOS');

-- CreateEnum
CREATE TYPE "EstrategiaResponsavelInativo" AS ENUM ('USUARIO_SECUNDARIO', 'ABERTO_SETOR', 'RETORNAR_ORIGEM');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "TipoContagemPrazo" AS ENUM ('DIAS_UTEIS', 'DIAS_CORRIDOS');

-- CreateEnum
CREATE TYPE "TipoCampo" AS ENUM ('TEXTO', 'TEXTO_LONGO', 'NUMERO', 'DATA', 'SELECAO');

-- CreateEnum
CREATE TYPE "NivelSigilo" AS ENUM ('PUBLICO', 'RESTRITO', 'SIGILOSO', 'SECRETO');

-- CreateEnum
CREATE TYPE "StatusProcesso" AS ENUM ('ABERTO', 'RECEBIDO', 'EM_ANALISE', 'EM_ANDAMENTO', 'AGUARDANDO_DOCUMENTOS', 'AGUARDANDO_PAGAMENTO', 'TRANSFERIDO', 'CONCLUIDO', 'ARQUIVADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('CRIADO', 'RECEBIDO', 'ANALISE', 'ANDAMENTO', 'TRANSFERENCIA', 'DEVOLUCAO', 'PARECER', 'COMENTARIO', 'JUNTADA_DOCUMENTO', 'REGISTRO_PAGAMENTO', 'CONCLUSAO', 'ARQUIVAMENTO', 'REABERTURA', 'CANCELAMENTO', 'APENSAMENTO', 'DESAPENSAMENTO', 'ANEXACAO', 'ASSINATURA', 'DESENTRANHAMENTO', 'SOLICITACAO_PENDENCIA', 'CUMPRIMENTO_PENDENCIA', 'PRORROGACAO_PRAZO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "matricula" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NivelOrganograma" (
    "id" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "NivelOrganograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organograma" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "sigla" TEXT,
    "nivelId" TEXT NOT NULL,
    "paiId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Organograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsavelOrganograma" (
    "id" TEXT NOT NULL,
    "organogramaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ehTitular" BOOLEAN NOT NULL DEFAULT false,
    "podeVerSubsetores" BOOLEAN NOT NULL DEFAULT false,
    "substitutoId" TEXT,

    CONSTRAINT "ResponsavelOrganograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioOrganograma" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "organogramaId" TEXT NOT NULL,
    "ehPrimario" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UsuarioOrganograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoAtribuicaoOrganograma" (
    "id" TEXT NOT NULL,
    "organogramaId" TEXT NOT NULL,
    "tipoAtribuicao" "TipoAtribuicao" NOT NULL DEFAULT 'RESPONSAVEL',
    "estrategiaResponsavelInativo" "EstrategiaResponsavelInativo" NOT NULL DEFAULT 'RETORNAR_ORIGEM',

    CONSTRAINT "ConfiguracaoAtribuicaoOrganograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParteInteressada" (
    "id" TEXT NOT NULL,
    "tipoPessoa" "TipoPessoa" NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParteInteressada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoDocumento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "formatosPermitidos" TEXT[],
    "tamanhoMaximoMb" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "TipoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assunto" (
    "id" TEXT NOT NULL,
    "codigo" INTEGER NOT NULL,
    "secretariaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "disponivelParaNovasAberturas" BOOLEAN NOT NULL DEFAULT true,
    "permiteAberturaExterna" BOOLEAN NOT NULL DEFAULT true,
    "permiteAberturaInterna" BOOLEAN NOT NULL DEFAULT true,
    "permiteAnonimo" BOOLEAN NOT NULL DEFAULT false,
    "permiteSigiloso" BOOLEAN NOT NULL DEFAULT false,
    "exigeObservacao" BOOLEAN NOT NULL DEFAULT false,
    "exigeComentarios" BOOLEAN NOT NULL DEFAULT false,
    "permiteTramitacao" BOOLEAN NOT NULL DEFAULT true,
    "tipoAtribuicao" "TipoAtribuicao" NOT NULL DEFAULT 'RESPONSAVEL',
    "prazoLegalDias" INTEGER,
    "tipoContagemPrazo" "TipoContagemPrazo" NOT NULL DEFAULT 'DIAS_UTEIS',
    "organogramaDestinoId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Assunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssuntoDocumento" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "tipoDocumentoId" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AssuntoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoAdicionalAssunto" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "tipo" "TipoCampo" NOT NULL,
    "placeholder" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CampoAdicionalAssunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenciaProtocolo" (
    "ano" INTEGER NOT NULL,
    "ultimaSequencia" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SequenciaProtocolo_pkey" PRIMARY KEY ("ano")
);

-- CreateTable
CREATE TABLE "Processo" (
    "id" TEXT NOT NULL,
    "numeroProtocolo" TEXT NOT NULL,
    "numeroSequencial" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "requerenteId" TEXT,
    "motivo" TEXT,
    "status" "StatusProcesso" NOT NULL DEFAULT 'ABERTO',
    "organogramaAtualId" TEXT NOT NULL,
    "organogramaOrigemId" TEXT,
    "organogramaDestinoId" TEXT,
    "usuarioAtribuidoId" TEXT,
    "estaBloqueado" BOOLEAN NOT NULL DEFAULT false,
    "ehAnonimo" BOOLEAN NOT NULL DEFAULT false,
    "nivelSigilo" "NivelSigilo" NOT NULL DEFAULT 'PUBLICO',
    "dataLimite" TIMESTAMP(3),
    "estaAtrasado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoProcesso" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "usuarioId" TEXT,
    "observacao" TEXT,
    "comentarios" TEXT,
    "textoParecer" TEXT,
    "ehConclusivo" BOOLEAN NOT NULL DEFAULT false,
    "ehPublico" BOOLEAN NOT NULL DEFAULT true,
    "autorizadoPorUsuarioId" TEXT,
    "observacaoAutorizacao" TEXT,
    "organogramaOrigemId" TEXT,
    "organogramaDestinoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessoInteressado" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "parteInteressadaId" TEXT NOT NULL,
    "papel" TEXT,

    CONSTRAINT "ProcessoInteressado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessoCampoAdicional" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "campoAdicionalId" TEXT NOT NULL,
    "valor" TEXT,

    CONSTRAINT "ProcessoCampoAdicional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tipoDocumentoId" TEXT,
    "nome" TEXT NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "numeroOrdem" INTEGER,
    "numeroFolhaInicial" INTEGER,
    "numeroFolhaFinal" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeriadoMunicipal" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "ehRecorrente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FeriadoMunicipal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_authId_key" ON "Usuario"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NivelOrganograma_nivel_key" ON "NivelOrganograma"("nivel");

-- CreateIndex
CREATE UNIQUE INDEX "Organograma_codigo_key" ON "Organograma"("codigo");

-- CreateIndex
CREATE INDEX "Organograma_paiId_idx" ON "Organograma"("paiId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsavelOrganograma_organogramaId_usuarioId_key" ON "ResponsavelOrganograma"("organogramaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioOrganograma_usuarioId_organogramaId_key" ON "UsuarioOrganograma"("usuarioId", "organogramaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoAtribuicaoOrganograma_organogramaId_key" ON "ConfiguracaoAtribuicaoOrganograma"("organogramaId");

-- CreateIndex
CREATE UNIQUE INDEX "ParteInteressada_cpfCnpj_key" ON "ParteInteressada"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Assunto_codigo_secretariaId_key" ON "Assunto"("codigo", "secretariaId");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_numeroProtocolo_key" ON "Processo"("numeroProtocolo");

-- CreateIndex
CREATE INDEX "Processo_assuntoId_idx" ON "Processo"("assuntoId");

-- CreateIndex
CREATE INDEX "Processo_organogramaAtualId_idx" ON "Processo"("organogramaAtualId");

-- CreateIndex
CREATE INDEX "MovimentacaoProcesso_processoId_idx" ON "MovimentacaoProcesso"("processoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoInteressado_processoId_parteInteressadaId_key" ON "ProcessoInteressado"("processoId", "parteInteressadaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoCampoAdicional_processoId_campoAdicionalId_key" ON "ProcessoCampoAdicional"("processoId", "campoAdicionalId");

-- CreateIndex
CREATE INDEX "Documento_processoId_idx" ON "Documento"("processoId");

-- AddForeignKey
ALTER TABLE "Organograma" ADD CONSTRAINT "Organograma_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "NivelOrganograma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organograma" ADD CONSTRAINT "Organograma_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Organograma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsavelOrganograma" ADD CONSTRAINT "ResponsavelOrganograma_organogramaId_fkey" FOREIGN KEY ("organogramaId") REFERENCES "Organograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsavelOrganograma" ADD CONSTRAINT "ResponsavelOrganograma_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioOrganograma" ADD CONSTRAINT "UsuarioOrganograma_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioOrganograma" ADD CONSTRAINT "UsuarioOrganograma_organogramaId_fkey" FOREIGN KEY ("organogramaId") REFERENCES "Organograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoAtribuicaoOrganograma" ADD CONSTRAINT "ConfiguracaoAtribuicaoOrganograma_organogramaId_fkey" FOREIGN KEY ("organogramaId") REFERENCES "Organograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssuntoDocumento" ADD CONSTRAINT "AssuntoDocumento_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssuntoDocumento" ADD CONSTRAINT "AssuntoDocumento_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "TipoDocumento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoAdicionalAssunto" ADD CONSTRAINT "CampoAdicionalAssunto_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_requerenteId_fkey" FOREIGN KEY ("requerenteId") REFERENCES "ParteInteressada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_organogramaAtualId_fkey" FOREIGN KEY ("organogramaAtualId") REFERENCES "Organograma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_usuarioAtribuidoId_fkey" FOREIGN KEY ("usuarioAtribuidoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoProcesso" ADD CONSTRAINT "MovimentacaoProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoProcesso" ADD CONSTRAINT "MovimentacaoProcesso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoInteressado" ADD CONSTRAINT "ProcessoInteressado_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoInteressado" ADD CONSTRAINT "ProcessoInteressado_parteInteressadaId_fkey" FOREIGN KEY ("parteInteressadaId") REFERENCES "ParteInteressada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoCampoAdicional" ADD CONSTRAINT "ProcessoCampoAdicional_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoCampoAdicional" ADD CONSTRAINT "ProcessoCampoAdicional_campoAdicionalId_fkey" FOREIGN KEY ("campoAdicionalId") REFERENCES "CampoAdicionalAssunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "TipoDocumento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

