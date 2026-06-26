import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  CriarCarreiraDto,
  AtualizarCarreiraDto,
  CriarFaixaDto,
} from './dto/carreira.dto'

@Injectable()
export class CarreirasService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CriarCarreiraDto) {
    return this.prisma.carreira.create({ data: dto })
  }

  listar() {
    return this.prisma.carreira.findMany({
      orderBy: { nome: 'asc' },
      include: { faixas: true },
    })
  }

  async atualizar(id: string, dto: AtualizarCarreiraDto) {
    await this.garantirExiste(id)
    return this.prisma.carreira.update({ where: { id }, data: dto })
  }

  async adicionarFaixa(carreiraId: string, dto: CriarFaixaDto) {
    await this.garantirExiste(carreiraId)
    const duplicada = await this.prisma.faixaSalarial.findUnique({
      where: {
        carreiraId_classe_referencia: {
          carreiraId,
          classe: dto.classe,
          referencia: dto.referencia,
        },
      },
      select: { id: true },
    })
    if (duplicada) throw new ConflictException('Faixa já existe (classe/referência)')
    return this.prisma.faixaSalarial.create({ data: { carreiraId, ...dto } })
  }

  private async garantirExiste(id: string) {
    const existe = await this.prisma.carreira.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existe) throw new NotFoundException('Carreira não encontrada')
  }
}
