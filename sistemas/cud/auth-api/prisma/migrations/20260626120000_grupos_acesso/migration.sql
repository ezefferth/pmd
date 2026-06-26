-- CreateTable
CREATE TABLE "GrupoAcesso" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrupoAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoAcessoPerfil" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,

    CONSTRAINT "GrupoAcessoPerfil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrupoAcesso_slug_key" ON "GrupoAcesso"("slug");

-- CreateIndex
CREATE INDEX "GrupoAcessoPerfil_perfilId_idx" ON "GrupoAcessoPerfil"("perfilId");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoAcessoPerfil_grupoId_perfilId_key" ON "GrupoAcessoPerfil"("grupoId", "perfilId");

-- AddForeignKey
ALTER TABLE "GrupoAcessoPerfil" ADD CONSTRAINT "GrupoAcessoPerfil_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoAcesso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoAcessoPerfil" ADD CONSTRAINT "GrupoAcessoPerfil_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;
