import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Usuario } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CriarSetorDto } from './dto/criar-setor.dto'
import { AtualizarSetorDto } from './dto/atualizar-setor.dto'

@Injectable()
export class SetoresService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ────────────────────────────────────────────────────

  async criar(dto: CriarSetorDto) {
    if (dto.paiId) await this.garantirExiste(dto.paiId)
    return this.prisma.setor.create({ data: dto })
  }

  listarArvore() {
    return this.prisma.setor.findMany({ orderBy: { nome: 'asc' } })
  }

  async buscarPorId(id: string) {
    const setor = await this.prisma.setor.findUnique({ where: { id } })
    if (!setor) throw new NotFoundException('Setor não encontrado')
    return setor
  }

  async atualizar(id: string, dto: AtualizarSetorDto) {
    await this.garantirExiste(id)
    if (dto.paiId) await this.garantirSemCiclo(id, dto.paiId)
    return this.prisma.setor.update({ where: { id }, data: dto })
  }

  async desativar(id: string) {
    await this.garantirExiste(id)
    return this.prisma.setor.update({ where: { id }, data: { ativo: false } })
  }

  // ── Administradores (RN-CUD-038/041) ────────────────────────

  async nomearAdmin(setorId: string, usuarioId: string, ator: Usuario) {
    await this.garantirExiste(setorId)
    await this.garantirPodeAdministrar(ator, setorId)
    return this.prisma.administradorSetor.upsert({
      where: { setorId_usuarioId: { setorId, usuarioId } },
      create: { setorId, usuarioId, nomeadoPorId: ator.id, ativo: true },
      update: { ativo: true, nomeadoPorId: ator.id },
    })
  }

  async removerAdmin(setorId: string, usuarioId: string, ator: Usuario) {
    await this.garantirPodeAdministrar(ator, setorId)
    await this.prisma.administradorSetor.updateMany({
      where: { setorId, usuarioId },
      data: { ativo: false },
    })
    return { removido: true }
  }

  listarAdmins(setorId: string) {
    return this.prisma.administradorSetor.findMany({
      where: { setorId, ativo: true },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    })
  }

  // ── Lotação ─────────────────────────────────────────────────

  async definirLotacao(setorId: string, usuarioId: string, ator: Usuario) {
    await this.garantirExiste(setorId)
    await this.garantirPodeAdministrar(ator, setorId)
    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { setorId },
      select: { id: true, nome: true, setorId: true },
    })
  }

  // ── Escopo (RN-CUD-039) ─────────────────────────────────────

  /** União das subárvores dos setores que o usuário administra. */
  async resolverEscopo(usuarioId: string): Promise<string[]> {
    const administrados = await this.prisma.administradorSetor.findMany({
      where: { usuarioId, ativo: true },
      select: { setorId: true },
    })
    if (administrados.length === 0) return []

    const filhosPorPai = await this.mapaFilhos()
    const escopo = new Set<string>()
    const pilha = administrados.map((a) => a.setorId)
    while (pilha.length) {
      const atual = pilha.pop()!
      if (escopo.has(atual)) continue
      escopo.add(atual)
      for (const filho of filhosPorPai.get(atual) ?? []) pilha.push(filho)
    }
    return [...escopo]
  }

  private async garantirPodeAdministrar(ator: Usuario, setorId: string) {
    if (ator.ehAdminGlobal) return // topo da hierarquia (RN-CUD-043)
    const escopo = await this.resolverEscopo(ator.id)
    if (!escopo.includes(setorId)) {
      throw new ForbiddenException('Setor fora do seu escopo de administração')
    }
  }

  // ── auxiliares ──────────────────────────────────────────────

  private async mapaFilhos(): Promise<Map<string, string[]>> {
    const setores = await this.prisma.setor.findMany({
      select: { id: true, paiId: true },
    })
    const mapa = new Map<string, string[]>()
    for (const setor of setores) {
      if (!setor.paiId) continue
      const filhos = mapa.get(setor.paiId) ?? []
      filhos.push(setor.id)
      mapa.set(setor.paiId, filhos)
    }
    return mapa
  }

  /** Impede que o novo pai seja o próprio setor ou um descendente (ciclo). */
  private async garantirSemCiclo(id: string, novoPaiId: string) {
    if (id === novoPaiId) {
      throw new BadRequestException('Um setor não pode ser pai de si mesmo')
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
      throw new BadRequestException('paiId não pode ser um descendente do setor')
    }
  }

  private async garantirExiste(id: string) {
    const existe = await this.prisma.setor.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existe) throw new NotFoundException('Setor não encontrado')
  }
}
