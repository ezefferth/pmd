import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarPerfilDto } from './dto/criar-perfil.dto'
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto'

@Injectable()
export class PerfisService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarPerfilDto) {
    const sistema = await this.prisma.sistema.findUnique({
      where: { id: dto.sistemaId },
      select: { id: true },
    })
    if (!sistema) throw new NotFoundException('Sistema não encontrado')

    const duplicado = await this.prisma.perfil.findUnique({
      where: { sistemaId_slug: { sistemaId: dto.sistemaId, slug: dto.slug } },
      select: { id: true },
    })
    if (duplicado) throw new ConflictException('Já existe perfil com esse slug no sistema')

    // RN-CUD-014: perfil com curinga "*" é administrativo
    const ehAdministrativo = dto.permissoes.includes('*') ? true : dto.ehAdministrativo ?? false

    return this.prisma.perfil.create({
      data: {
        sistemaId: dto.sistemaId,
        nome: dto.nome,
        slug: dto.slug,
        descricao: dto.descricao,
        permissoes: dto.permissoes,
        ehAdministrativo,
        permiteExterno: dto.permiteExterno ?? false,
      },
    })
  }

  listarPorSistema(sistemaId: string) {
    return this.prisma.perfil.findMany({
      where: { sistemaId },
      orderBy: { nome: 'asc' },
    })
  }

  async atualizar(id: string, dto: AtualizarPerfilDto) {
    await this.garantirExiste(id)
    const ehAdministrativo = dto.permissoes?.includes('*')
      ? true
      : dto.ehAdministrativo

    return this.prisma.perfil.update({
      where: { id },
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        permissoes: dto.permissoes,
        ehAdministrativo,
        permiteExterno: dto.permiteExterno,
        ativo: dto.ativo,
      },
    })
  }

  async excluir(id: string) {
    await this.garantirExiste(id)
    // RN-CUD-015: não excluir perfil com acessos ativos
    const acessosAtivos = await this.prisma.acesso.count({
      where: { perfilId: id, ativo: true },
    })
    if (acessosAtivos > 0) {
      throw new BadRequestException(
        'Perfil possui acessos ativos — revogue ou migre antes de excluir',
      )
    }
    await this.prisma.perfil.delete({ where: { id } })
    return { excluido: true }
  }

  private async garantirExiste(id: string) {
    const existe = await this.prisma.perfil.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existe) throw new NotFoundException('Perfil não encontrado')
  }
}
