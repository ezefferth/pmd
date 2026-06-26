-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('PENDENTE_ATIVACAO', 'ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoVinculo" AS ENUM ('EXTERNO', 'EFETIVO', 'COMISSIONADO', 'ESTAGIARIO', 'ELETIVO', 'TEMPORARIO');

-- CreateEnum
CREATE TYPE "SituacaoFuncional" AS ENUM ('ATIVO', 'FERIAS', 'AFASTADO', 'LICENCA', 'CEDIDO', 'VACANCIA', 'EXONERADO', 'APOSENTADO');

-- CreateEnum
CREATE TYPE "AcaoAuditoria" AS ENUM ('CRIAR', 'ATUALIZAR', 'EXCLUIR', 'CONCEDER_ACESSO', 'REVOGAR_ACESSO', 'LOGIN', 'LOGOUT', 'REDEFINIR_SENHA', 'BLOQUEAR_USUARIO', 'ATIVAR_USUARIO', 'NOMEAR_ADMIN_SETOR', 'REMOVER_ADMIN_SETOR', 'MUDAR_VINCULO', 'SINCRONIZAR_FICHA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailSecundario" TEXT,
    "matricula" TEXT,
    "telefone" TEXT,
    "telefoneSecundario" TEXT,
    "authId" TEXT,
    "status" "StatusUsuario" NOT NULL DEFAULT 'PENDENTE_ATIVACAO',
    "tipoVinculo" "TipoVinculo" NOT NULL DEFAULT 'EXTERNO',
    "ehAdminGlobal" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "setorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sistema" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "urlBase" TEXT,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "sistemaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "permissoes" TEXT[],
    "ehAdministrativo" BOOLEAN NOT NULL DEFAULT false,
    "permiteExterno" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acesso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "sistemaId" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "concedidoPorId" TEXT,
    "dataConcessao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataExpiracao" TIMESTAMP(3),
    "motivo" TEXT,

    CONSTRAINT "Acesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "paiId" TEXT,
    "rhId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministradorSetor" (
    "id" TEXT NOT NULL,
    "setorId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "nomeadoPorId" TEXT,
    "dataNomeacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdministradorSetor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaFuncional" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "matricula" TEXT,
    "cargo" TEXT,
    "setorLotacaoId" TEXT,
    "regimeJuridico" TEXT,
    "situacaoFuncional" "SituacaoFuncional" NOT NULL DEFAULT 'ATIVO',
    "dataAdmissao" TIMESTAMP(3),
    "dataExoneracao" TIMESTAMP(3),
    "rhId" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FichaFuncional_pkey" PRIMARY KEY ("id")
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
    "enderecoIp" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_matricula_key" ON "Usuario"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_authId_key" ON "Usuario"("authId");

-- CreateIndex
CREATE INDEX "Usuario_setorId_idx" ON "Usuario"("setorId");

-- CreateIndex
CREATE UNIQUE INDEX "Sistema_slug_key" ON "Sistema"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_sistemaId_slug_key" ON "Perfil"("sistemaId", "slug");

-- CreateIndex
CREATE INDEX "Acesso_sistemaId_idx" ON "Acesso"("sistemaId");

-- CreateIndex
CREATE INDEX "Acesso_perfilId_idx" ON "Acesso"("perfilId");

-- CreateIndex
CREATE UNIQUE INDEX "Acesso_usuarioId_sistemaId_key" ON "Acesso"("usuarioId", "sistemaId");

-- CreateIndex
CREATE UNIQUE INDEX "Setor_rhId_key" ON "Setor"("rhId");

-- CreateIndex
CREATE INDEX "Setor_paiId_idx" ON "Setor"("paiId");

-- CreateIndex
CREATE INDEX "AdministradorSetor_usuarioId_idx" ON "AdministradorSetor"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AdministradorSetor_setorId_usuarioId_key" ON "AdministradorSetor"("setorId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "FichaFuncional_usuarioId_key" ON "FichaFuncional"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "FichaFuncional_rhId_key" ON "FichaFuncional"("rhId");

-- CreateIndex
CREATE INDEX "LogAuditoria_atorId_idx" ON "LogAuditoria"("atorId");

-- CreateIndex
CREATE INDEX "LogAuditoria_entidade_entidadeId_idx" ON "LogAuditoria"("entidade", "entidadeId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_sistemaId_fkey" FOREIGN KEY ("sistemaId") REFERENCES "Sistema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acesso" ADD CONSTRAINT "Acesso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acesso" ADD CONSTRAINT "Acesso_sistemaId_fkey" FOREIGN KEY ("sistemaId") REFERENCES "Sistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acesso" ADD CONSTRAINT "Acesso_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acesso" ADD CONSTRAINT "Acesso_concedidoPorId_fkey" FOREIGN KEY ("concedidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setor" ADD CONSTRAINT "Setor_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministradorSetor" ADD CONSTRAINT "AdministradorSetor_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministradorSetor" ADD CONSTRAINT "AdministradorSetor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministradorSetor" ADD CONSTRAINT "AdministradorSetor_nomeadoPorId_fkey" FOREIGN KEY ("nomeadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaFuncional" ADD CONSTRAINT "FichaFuncional_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaFuncional" ADD CONSTRAINT "FichaFuncional_setorLotacaoId_fkey" FOREIGN KEY ("setorLotacaoId") REFERENCES "Setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAuditoria" ADD CONSTRAINT "LogAuditoria_atorId_fkey" FOREIGN KEY ("atorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

