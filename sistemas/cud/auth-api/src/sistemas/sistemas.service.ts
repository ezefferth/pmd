import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarSistemaDto } from './dto/criar-sistema.dto'
import { AtualizarSistemaDto } from './dto/atualizar-sistema.dto'

@Injectable()
export class SistemasService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarSistemaDto) {
    const existente = await this.prisma.sistema.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    })
    if (existente) throw new ConflictException('Slug de sistema já existe')

    return this.prisma.sistema.create({ data: dto })
  }

  listar() {
    return this.prisma.sistema.findMany({ orderBy: { nome: 'asc' } })
  }

  async buscarPorId(id: string) {
    const sistema = await this.prisma.sistema.findUnique({ where: { id } })
    if (!sistema) throw new NotFoundException('Sistema não encontrado')
    return sistema
  }

  async atualizar(id: string, dto: AtualizarSistemaDto) {
    await this.buscarPorId(id)
    return this.prisma.sistema.update({ where: { id }, data: dto })
  }
}
