import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { StatusUsuario, TipoVinculo } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../cache/cache.service'
import { ConcederAcessoDto } from './dto/conceder-acesso.dto'
import { VerificarAcessoDto } from './dto/verificar-acesso.dto'

const TTL_VERIFICACAO_SEG = 45

export interface VerificarAcessoResposta {
  temAcesso: boolean
  perfil: string
  permissoes: string[]
}

// guardado no cache por (usuarioId, sistemaId)
interface AcessoCacheado {
  perfilSlug: string
  permissoes: string[]
  permiteExterno: boolean
}

@Injectable()
export class AcessosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async conceder(dto: ConcederAcessoDto, concedidoPorId: string) {
    const perfil = await this.prisma.perfil.findUnique({
      where: { id: dto.perfilId },
      select: { sistemaId: true },
    })
    if (!perfil) throw new NotFoundException('Perfil não encontrado')
    // RN-CUD-019: perfil deve ser do mesmo sistema do acesso
    if (perfil.sistemaId !== dto.sistemaId) {
      throw new BadRequestException('Perfil não pertence ao sistema informado')
    }

    const acesso = await this.prisma.acesso.upsert({
      where: {
        usuarioId_sistemaId: {
          usuarioId: dto.usuarioId,
          sistemaId: dto.sistemaId,
        },
      },
      create: {
        usuarioId: dto.usuarioId,
        sistemaId: dto.sistemaId,
        perfilId: dto.perfilId,
        concedidoPorId,
        dataExpiracao: dto.dataExpiracao ? new Date(dto.dataExpiracao) : null,
        motivo: dto.motivo,
        ativo: true,
      },
      update: {
        perfilId: dto.perfilId,
        concedidoPorId,
        dataExpiracao: dto.dataExpiracao ? new Date(dto.dataExpiracao) : null,
        motivo: dto.motivo,
        ativo: true,
      },
    })

    await this.cache.invalidar(this.chave(dto.usuarioId, dto.sistemaId))
    return acesso
  }

  async revogar(usuarioId: string, sistemaId: string) {
    await this.prisma.acesso.updateMany({
      where: { usuarioId, sistemaId },
      data: { ativo: false },
    })
    await this.cache.invalidar(this.chave(usuarioId, sistemaId))
    return { revogado: true }
  }

  listarPorUsuario(usuarioId: string) {
    return this.prisma.acesso.findMany({
      where: { usuarioId },
      include: { sistema: true, perfil: true },
    })
  }

  /** Contrato de integração (RN-CUD-020/050/022). Nunca lança 5xx para "sem acesso". */
  async verificar(dto: VerificarAcessoDto): Promise<VerificarAcessoResposta> {
    const negado: VerificarAcessoResposta = {
      temAcesso: false,
      perfil: '',
      permissoes: [],
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { authId: dto.usuarioId },
      select: { id: true, status: true, tipoVinculo: true },
    })
    if (!usuario || usuario.status !== StatusUsuario.ATIVO) return negado

    const sistema = await this.prisma.sistema.findFirst({
      where: { OR: [{ slug: dto.sistemaId }, { id: dto.sistemaId }], ativo: true },
      select: { id: true },
    })
    if (!sistema) return negado

    const chave = this.chave(usuario.id, sistema.id)
    let dados = await this.cache.obter<AcessoCacheado>(chave)
    if (!dados) {
      const acesso = await this.prisma.acesso.findFirst({
        where: {
          usuarioId: usuario.id,
          sistemaId: sistema.id,
          ativo: true,
          OR: [{ dataExpiracao: null }, { dataExpiracao: { gt: new Date() } }],
        },
        include: { perfil: true },
      })
      if (!acesso) return negado
      dados = {
        perfilSlug: acesso.perfil.slug,
        permissoes: acesso.perfil.permissoes,
        permiteExterno: acesso.perfil.permiteExterno,
      }
      await this.cache.salvar(chave, dados, TTL_VERIFICACAO_SEG)
    }

    // RN-CUD-050: externo só acessa perfil com permiteExterno
    if (usuario.tipoVinculo === TipoVinculo.EXTERNO && !dados.permiteExterno) {
      return negado
    }

    const temAcesso =
      dados.permissoes.includes('*') || dados.permissoes.includes(dto.permissao)

    return { temAcesso, perfil: dados.perfilSlug, permissoes: dados.permissoes }
  }

  private chave(usuarioId: string, sistemaId: string): string {
    return `verificar:${usuarioId}:${sistemaId}`
  }
}
