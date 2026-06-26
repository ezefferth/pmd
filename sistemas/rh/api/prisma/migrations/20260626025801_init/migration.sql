-- CreateEnum
CREATE TYPE "TipoUnidade" AS ENUM ('SECRETARIA', 'DEPARTAMENTO', 'COORDENADORIA', 'SETOR');

-- CreateEnum
CREATE TYPE "TipoCargo" AS ENUM ('EFETIVO', 'COMISSAO', 'FUNCAO_GRATIFICADA', 'ESTAGIO', 'TEMPORARIO', 'ELETIVO');

-- CreateEnum
CREATE TYPE "TipoVinculoFuncional" AS ENUM ('EFETIVO', 'COMISSIONADO', 'ESTAGIARIO', 'ELETIVO', 'TEMPORARIO');

-- CreateEnum
CREATE TYPE "RegimeJuridico" AS ENUM ('ESTATUTARIO', 'CELETISTA', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "SituacaoFuncional" AS ENUM ('ATIVO', 'FERIAS', 'AFASTADO', 'LICENCA', 'CEDIDO', 'VACANCIA', 'EXONERADO', 'APOSENTADO');

-- CreateEnum
CREATE TYPE "TipoMovimentacaoFuncional" AS ENUM ('ADMISSAO', 'POSSE', 'NOMEACAO', 'DESIGNACAO_CONFIANCA', 'DISPENSA_CONFIANCA', 'REMOCAO', 'PROGRESSAO', 'PROMOCAO', 'LICENCA', 'AFASTAMENTO', 'CESSAO', 'EXONERACAO', 'APOSENTADORIA', 'FALECIMENTO');

-- CreateEnum
CREATE TYPE "AcaoAuditoria" AS ENUM ('CRIAR', 'ATUALIZAR', 'EXCLUIR', 'SINCRONIZAR_CUD');

-- CreateTable
CREATE TABLE "UnidadeOrganizacional" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "tipo" "TipoUnidade" NOT NULL,
    "paiId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnidadeOrganizacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carreira" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "leiReferencia" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Carreira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCargo" NOT NULL,
    "carreiraId" TEXT,
    "simbolo" TEXT,
    "escolaridadeExigida" TEXT,
    "cargaHorariaSemanal" INTEGER NOT NULL DEFAULT 40,
    "quantidadeVagas" INTEGER,
    "leiCriacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaixaSalarial" (
    "id" TEXT NOT NULL,
    "carreiraId" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "vencimentoBase" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "FaixaSalarial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servidor" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT,
    "tipoVinculo" "TipoVinculoFuncional" NOT NULL,
    "regimeJuridico" "RegimeJuridico" NOT NULL,
    "cargoId" TEXT NOT NULL,
    "unidadeLotacaoId" TEXT NOT NULL,
    "classe" TEXT,
    "referencia" TEXT,
    "situacao" "SituacaoFuncional" NOT NULL DEFAULT 'ATIVO',
    "dataAdmissao" TIMESTAMP(3) NOT NULL,
    "dataExoneracao" TIMESTAMP(3),
    "cargaHoraria" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignacaoConfianca" (
    "id" TEXT NOT NULL,
    "servidorId" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "atoPortaria" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DesignacaoConfianca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoFuncional" (
    "id" TEXT NOT NULL,
    "servidorId" TEXT NOT NULL,
    "tipo" "TipoMovimentacaoFuncional" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atoPortaria" TEXT,
    "unidadeOrigemId" TEXT,
    "unidadeDestinoId" TEXT,
    "cargoId" TEXT,
    "observacao" TEXT,

    CONSTRAINT "MovimentacaoFuncional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL,
    "atorId" TEXT,
    "acao" "AcaoAuditoria" NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNovo" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnidadeOrganizacional_paiId_idx" ON "UnidadeOrganizacional"("paiId");

-- CreateIndex
CREATE INDEX "Cargo_carreiraId_idx" ON "Cargo"("carreiraId");

-- CreateIndex
CREATE UNIQUE INDEX "FaixaSalarial_carreiraId_classe_referencia_key" ON "FaixaSalarial"("carreiraId", "classe", "referencia");

-- CreateIndex
CREATE UNIQUE INDEX "Servidor_cpf_key" ON "Servidor"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Servidor_matricula_key" ON "Servidor"("matricula");

-- CreateIndex
CREATE INDEX "Servidor_cargoId_idx" ON "Servidor"("cargoId");

-- CreateIndex
CREATE INDEX "Servidor_unidadeLotacaoId_idx" ON "Servidor"("unidadeLotacaoId");

-- CreateIndex
CREATE INDEX "DesignacaoConfianca_servidorId_idx" ON "DesignacaoConfianca"("servidorId");

-- CreateIndex
CREATE INDEX "MovimentacaoFuncional_servidorId_idx" ON "MovimentacaoFuncional"("servidorId");

-- CreateIndex
CREATE INDEX "LogAuditoria_entidade_entidadeId_idx" ON "LogAuditoria"("entidade", "entidadeId");

-- AddForeignKey
ALTER TABLE "UnidadeOrganizacional" ADD CONSTRAINT "UnidadeOrganizacional_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "UnidadeOrganizacional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_carreiraId_fkey" FOREIGN KEY ("carreiraId") REFERENCES "Carreira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaixaSalarial" ADD CONSTRAINT "FaixaSalarial_carreiraId_fkey" FOREIGN KEY ("carreiraId") REFERENCES "Carreira"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servidor" ADD CONSTRAINT "Servidor_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servidor" ADD CONSTRAINT "Servidor_unidadeLotacaoId_fkey" FOREIGN KEY ("unidadeLotacaoId") REFERENCES "UnidadeOrganizacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignacaoConfianca" ADD CONSTRAINT "DesignacaoConfianca_servidorId_fkey" FOREIGN KEY ("servidorId") REFERENCES "Servidor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignacaoConfianca" ADD CONSTRAINT "DesignacaoConfianca_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignacaoConfianca" ADD CONSTRAINT "DesignacaoConfianca_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "UnidadeOrganizacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFuncional" ADD CONSTRAINT "MovimentacaoFuncional_servidorId_fkey" FOREIGN KEY ("servidorId") REFERENCES "Servidor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFuncional" ADD CONSTRAINT "MovimentacaoFuncional_unidadeOrigemId_fkey" FOREIGN KEY ("unidadeOrigemId") REFERENCES "UnidadeOrganizacional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFuncional" ADD CONSTRAINT "MovimentacaoFuncional_unidadeDestinoId_fkey" FOREIGN KEY ("unidadeDestinoId") REFERENCES "UnidadeOrganizacional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFuncional" ADD CONSTRAINT "MovimentacaoFuncional_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
