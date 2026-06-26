import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  Prisma,
  SituacaoFuncional,
  TipoMovimentacaoFuncional,
  TipoVinculoFuncional,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { validarCpf } from '../comum/cpf'
import { montarPaginado, ResultadoPaginado } from '../comum/paginacao'
import {
  CriarServidorDto,
  ListarServidoresDto,
} from './dto/servidor.dto'

const resumoSelect = {
  id: true,
  nome: true,
  cpf: true,
  matricula: true,
  tipoVinculo: true,
  situacao: true,
} satisfies Prisma.ServidorSelect

type ServidorResumo = Prisma.ServidorGetPayload<{ select: typeof resumoSelect }>

@Injectable()
export class ServidoresService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarServidorDto) {
    if (!validarCpf(dto.cpf)) throw new BadRequestException('CPF inválido')
    this.validarMatricula(dto.tipoVinculo, dto.matricula)

    const existente = await this.prisma.servidor.findFirst({
      where: { OR: [{ cpf: dto.cpf }, ...(dto.matricula ? [{ matricula: dto.matricula }] : [])] },
      select: { cpf: true },
    })
    if (existente) {
      throw new ConflictException(
        existente.cpf === dto.cpf ? 'CPF já cadastrado' : 'Matrícula já cadastrada',
      )
    }

    // admissão registra MovimentacaoFuncional (RN-RH-015)
    return this.prisma.$transaction(async (tx) => {
      const servidor = await tx.servidor.create({
        data: {
          cpf: dto.cpf,
          nome: dto.nome,
          matricula: dto.matricula,
          tipoVinculo: dto.tipoVinculo,
          regimeJuridico: dto.regimeJuridico,
          cargoId: dto.cargoId,
          unidadeLotacaoId: dto.unidadeLotacaoId,
          classe: dto.classe,
          referencia: dto.referencia,
          dataAdmissao: new Date(dto.dataAdmissao),
          cargaHoraria: dto.cargaHoraria,
        },
        select: resumoSelect,
      })
      await tx.movimentacaoFuncional.create({
        data: {
          servidorId: servidor.id,
          tipo: TipoMovimentacaoFuncional.ADMISSAO,
          cargoId: dto.cargoId,
          unidadeDestinoId: dto.unidadeLotacaoId,
        },
      })
      return servidor
    })
  }

  async listar(dto: ListarServidoresDto): Promise<ResultadoPaginado<ServidorResumo>> {
    const { pagina, limite } = dto
    const where: Prisma.ServidorWhereInput = {}
    if (dto.busca) {
      where.OR = [
        { nome: { contains: dto.busca, mode: 'insensitive' } },
        { cpf: { contains: dto.busca.replace(/\D/g, '') } },
        { matricula: { contains: dto.busca } },
      ]
    }
    if (dto.situacao) where.situacao = dto.situacao

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.servidor.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { nome: 'asc' },
        select: resumoSelect,
      }),
      this.prisma.servidor.count({ where }),
    ])
    return montarPaginado(itens, total, pagina, limite)
  }

  async buscarPorId(id: string) {
    const servidor = await this.prisma.servidor.findUnique({
      where: { id },
      include: {
        cargo: true,
        unidadeLotacao: true,
        designacoes: { where: { ativo: true } },
      },
    })
    if (!servidor) throw new NotFoundException('Servidor não encontrado')
    return servidor
  }

  async alterarSituacao(id: string, situacao: SituacaoFuncional) {
    await this.garantirExiste(id)
    return this.prisma.servidor.update({
      where: { id },
      data: { situacao },
      select: resumoSelect,
    })
  }

  private validarMatricula(tipo: TipoVinculoFuncional, matricula?: string) {
    const exige =
      tipo === TipoVinculoFuncional.EFETIVO ||
      tipo === TipoVinculoFuncional.COMISSIONADO
    if (exige && !matricula?.trim()) {
      throw new BadRequestException(
        'Matrícula obrigatória para efetivo/comissionado',
      )
    }
    if (tipo === TipoVinculoFuncional.ESTAGIARIO && matricula?.trim()) {
      throw new BadRequestException('Estagiário não possui matrícula')
    }
  }

  private async garantirExiste(id: string) {
    const existe = await this.prisma.servidor.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existe) throw new NotFoundException('Servidor não encontrado')
  }
}
