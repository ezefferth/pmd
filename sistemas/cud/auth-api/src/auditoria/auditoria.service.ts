import { Injectable, Logger } from '@nestjs/common'
import { AcaoAuditoria, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { ContextoRequisicao } from '../comum/contexto'
import { montarPaginado, ResultadoPaginado } from '../comum/paginacao'
import { ListarAuditoriaDto } from './dto/listar-auditoria.dto'

interface DadosAuditoria {
  acao: AcaoAuditoria
  entidade: string
  entidadeId: string
  valorAnterior?: unknown
  valorNovo?: unknown
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /** Registra um evento. Nunca lança — auditoria não pode derrubar a operação. */
  async registrar(contexto: ContextoRequisicao, dados: DadosAuditoria): Promise<void> {
    try {
      await this.prisma.logAuditoria.create({
        data: {
          atorId: contexto.ator?.id ?? null,
          acao: dados.acao,
          entidade: dados.entidade,
          entidadeId: dados.entidadeId,
          valorAnterior: this.comoJson(dados.valorAnterior),
          valorNovo: this.comoJson(dados.valorNovo),
          enderecoIp: contexto.enderecoIp,
          userAgent: contexto.userAgent,
        },
      })
    } catch {
      this.logger.warn(`Falha ao registrar auditoria (${dados.acao} ${dados.entidade})`)
    }
  }

  async listar(dto: ListarAuditoriaDto): Promise<ResultadoPaginado<unknown>> {
    const { pagina, limite } = dto
    const where: Prisma.LogAuditoriaWhereInput = {}
    if (dto.atorId) where.atorId = dto.atorId
    if (dto.acao) where.acao = dto.acao
    if (dto.entidade) where.entidade = dto.entidade
    if (dto.de || dto.ate) {
      where.criadoEm = {
        gte: dto.de ? new Date(dto.de) : undefined,
        lte: dto.ate ? new Date(dto.ate) : undefined,
      }
    }

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.logAuditoria.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.logAuditoria.count({ where }),
    ])

    return montarPaginado(itens, total, pagina, limite)
  }

  private comoJson(valor: unknown): Prisma.InputJsonValue | undefined {
    if (valor === undefined || valor === null) return undefined
    return valor as Prisma.InputJsonValue
  }
}
