import { Injectable, NotFoundException } from '@nestjs/common'
import { TipoCargo } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CriarCargoDto, AtualizarCargoDto } from './dto/cargo.dto'

@Injectable()
export class CargosService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CriarCargoDto) {
    return this.prisma.cargo.create({ data: dto })
  }

  listar(tipo?: TipoCargo) {
    return this.prisma.cargo.findMany({
      where: tipo ? { tipo } : undefined,
      orderBy: { nome: 'asc' },
      include: { carreira: { select: { id: true, nome: true } } },
    })
  }

  async atualizar(id: string, dto: AtualizarCargoDto) {
    await this.garantirExiste(id)
    return this.prisma.cargo.update({ where: { id }, data: dto })
  }

  private async garantirExiste(id: string) {
    const existe = await this.prisma.cargo.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existe) throw new NotFoundException('Cargo não encontrado')
  }
}
