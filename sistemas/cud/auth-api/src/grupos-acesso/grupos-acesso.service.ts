import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AcaoAuditoria } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AuditoriaService } from '../auditoria/auditoria.service'
import { AcessosService } from '../acessos/acessos.service'
import { ContextoRequisicao } from '../comum/contexto'
import { CriarGrupoAcessoDto } from './dto/criar-grupo-acesso.dto'
import { AtualizarGrupoAcessoDto } from './dto/atualizar-grupo-acesso.dto'

const INCLUDE_PERFIS = {
  perfis: { include: { perfil: { include: { sistema: true } } } },
} as const

@Injectable()
export class GruposAcessoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acessos: AcessosService,
  ) {}

  async criar(dto: CriarGrupoAcessoDto, contexto: ContextoRequisicao) {
    await this.validarSlugLivre(dto.slug)
    await this.validarPerfis(dto.perfilIds)

    const grupo = await this.prisma.grupoAcesso.create({
      data: {
        nome: dto.nome,
        slug: dto.slug,
        descricao: dto.descricao,
        perfis: { create: dto.perfilIds.map((perfilId) => ({ perfilId })) },
      },
      include: INCLUDE_PERFIS,
    })

    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.CRIAR,
      entidade: 'GrupoAcesso',
      entidadeId: grupo.id,
      valorNovo: { nome: grupo.nome, slug: grupo.slug, perfilIds: dto.perfilIds },
    })
    return grupo
  }

  listar() {
    return this.prisma.grupoAcesso.findMany({
      orderBy: { nome: 'asc' },
      include: INCLUDE_PERFIS,
    })
  }

  async obter(id: string) {
    const grupo = await this.prisma.grupoAcesso.findUnique({
      where: { id },
      include: INCLUDE_PERFIS,
    })
    if (!grupo) throw new NotFoundException('Grupo de acesso não encontrado')
    return grupo
  }

  async atualizar(
    id: string,
    dto: AtualizarGrupoAcessoDto,
    contexto: ContextoRequisicao,
  ) {
    await this.obter(id)
    if (dto.perfilIds) await this.validarPerfis(dto.perfilIds)

    const grupo = await this.prisma.$transaction(async (tx) => {
      if (dto.perfilIds) {
        // substitui o conjunto de perfis do grupo
        await tx.grupoAcessoPerfil.deleteMany({ where: { grupoId: id } })
        await tx.grupoAcessoPerfil.createMany({
          data: dto.perfilIds.map((perfilId) => ({ grupoId: id, perfilId })),
        })
      }
      return tx.grupoAcesso.update({
        where: { id },
        data: { nome: dto.nome, descricao: dto.descricao, ativo: dto.ativo },
        include: INCLUDE_PERFIS,
      })
    })

    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'GrupoAcesso',
      entidadeId: id,
      valorNovo: {
        nome: dto.nome,
        ativo: dto.ativo,
        perfilIds: dto.perfilIds,
      },
    })
    return grupo
  }

  async excluir(id: string, contexto: ContextoRequisicao) {
    await this.obter(id)
    // remove apenas a definição do grupo (join em cascata); acessos já
    // concedidos por aplicações anteriores permanecem (revogar é ação à parte)
    await this.prisma.grupoAcesso.delete({ where: { id } })
    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.EXCLUIR,
      entidade: 'GrupoAcesso',
      entidadeId: id,
    })
    return { excluido: true }
  }

  /** Aplica o grupo a um usuário: concede um Acesso por perfil do grupo. */
  async aplicar(
    id: string,
    usuarioId: string,
    motivo: string | undefined,
    contexto: ContextoRequisicao,
  ) {
    const grupo = await this.obter(id)
    if (!grupo.ativo) {
      throw new BadRequestException('Grupo de acesso inativo')
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    })
    if (!usuario) throw new NotFoundException('Usuário não encontrado')

    for (const item of grupo.perfis) {
      await this.acessos.conceder(
        {
          usuarioId,
          sistemaId: item.perfil.sistemaId,
          perfilId: item.perfilId,
          motivo: motivo ?? `Grupo de acesso: ${grupo.nome}`,
        },
        contexto,
      )
    }

    return { aplicado: true, acessosConcedidos: grupo.perfis.length }
  }

  private async validarSlugLivre(slug: string) {
    const existe = await this.prisma.grupoAcesso.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (existe) throw new ConflictException('Já existe grupo com esse slug')
  }

  /** Perfis devem existir e não pode haver mais de um perfil por sistema (RN-CUD-016). */
  private async validarPerfis(perfilIds: string[]) {
    const unicos = [...new Set(perfilIds)]
    const perfis = await this.prisma.perfil.findMany({
      where: { id: { in: unicos } },
      select: { id: true, sistemaId: true },
    })
    if (perfis.length !== unicos.length) {
      throw new BadRequestException('Um ou mais perfis não existem')
    }
    const sistemas = new Set<string>()
    for (const p of perfis) {
      if (sistemas.has(p.sistemaId)) {
        throw new BadRequestException(
          'O grupo não pode ter mais de um perfil do mesmo sistema',
        )
      }
      sistemas.add(p.sistemaId)
    }
  }
}
