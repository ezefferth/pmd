import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarUnidadeDto, AtualizarUnidadeDto } from './dto/unidade.dto'

@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarUnidadeDto) {
    if (dto.paiId) await this.garantirExiste(dto.paiId)
    return this.prisma.unidadeOrganizacional.create({ data: dto })
  }

  listarArvore() {
    return this.prisma.unidadeOrganizacional.findMany({
      orderBy: { nome: 'asc' },
    })
  }

  async buscarPorId(id: string) {
    const unidade = await this.prisma.unidadeOrganizacional.findUnique({
      where: { id },
    })
    if (!unidade) throw new NotFoundException('Unidade não encontrada')
    return unidade
  }

  async atualizar(id: string, dto: AtualizarUnidadeDto) {
    await this.garantirExiste(id)
    if (dto.paiId) await this.garantirSemCiclo(id, dto.paiId)
    return this.prisma.unidadeOrganizacional.update({ where: { id }, data: dto })
  }

  async desativar(id: string) {
    await this.garantirExiste(id)
    return this.prisma.unidadeOrganizacional.update({
      where: { id },
      data: { ativo: false },
    })
  }

  private async mapaFilhos(): Promise<Map<string, string[]>> {
    const unidades = await this.prisma.unidadeOrganizacional.findMany({
      select: { id: true, paiId: true },
    })
    const mapa = new Map<string, string[]>()
    for (const u of unidades) {
      if (!u.paiId) continue
      const filhos = mapa.get(u.paiId) ?? []
      filhos.push(u.id)
      mapa.set(u.paiId, filhos)
    }
    return mapa
  }

  private async garantirSemCiclo(id: string, novoPaiId: string) {
    if (id === novoPaiId) {
      throw new BadRequestException('Uma unidade não pode ser pai de si mesma')
    }
    const filhosPorPai = await this.mapaFilhos()
    const descendentes = new Set<string>()
    const pilha = [...(filhosPorPai.get(id) ?? [])]
    while (pilha.length) {
      const atual = pilha.pop()!
      if (descendentes.has(atual)) continue
      descendentes.add(atual)
      for (const filho of filhosPorPai.get(atual) ?? []) pilha.push(filho)
    }
    if (descendentes.has(novoPaiId)) {
      throw new BadRequestException('paiId não pode ser um descendente da unidade')
    }
  }

  private async garantirExiste(id: string) {
    const existe = await this.prisma.unidadeOrganizacional.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existe) throw new NotFoundException('Unidade não encontrada')
  }
}
