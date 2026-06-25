import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  AcaoAuditoria,
  Prisma,
  StatusUsuario,
  TipoVinculo,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { AuditoriaService } from '../auditoria/auditoria.service'
import { ContextoRequisicao } from '../comum/contexto'
import { validarCpf } from '../comum/cpf'
import { montarPaginado, ResultadoPaginado } from '../comum/paginacao'
import { CriarUsuarioDto } from './dto/criar-usuario.dto'
import { AutoRegistroDto } from './dto/auto-registro.dto'
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto'
import { AlterarVinculoDto } from './dto/alterar-vinculo.dto'
import { ListarUsuariosDto } from './dto/listar-usuarios.dto'

const resumoSelect = {
  id: true,
  nome: true,
  cpf: true,
  email: true,
  status: true,
  tipoVinculo: true,
  ehAdminGlobal: true,
  ativo: true,
} satisfies Prisma.UsuarioSelect

type UsuarioResumo = Prisma.UsuarioGetPayload<{ select: typeof resumoSelect }>

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async criar(dto: CriarUsuarioDto, contexto: ContextoRequisicao) {
    return this.criarComAuth(
      {
        nome: dto.nome,
        email: dto.email,
        cpf: dto.cpf,
        matricula: dto.matricula,
        telefone: dto.telefone,
        tipoVinculo: dto.tipoVinculo ?? TipoVinculo.EXTERNO,
        ehAdminGlobal: dto.ehAdminGlobal ?? false,
      },
      contexto,
    )
  }

  async autoRegistrar(dto: AutoRegistroDto, contexto: ContextoRequisicao) {
    // externo sempre nasce EXTERNO; senha definida pelo próprio usuário
    return this.criarComAuth(
      {
        nome: dto.nome,
        email: dto.email,
        cpf: dto.cpf,
        tipoVinculo: TipoVinculo.EXTERNO,
        ehAdminGlobal: false,
        senha: dto.senha,
      },
      contexto,
    )
  }

  async listar(dto: ListarUsuariosDto): Promise<ResultadoPaginado<UsuarioResumo>> {
    const { pagina, limite } = dto
    const where: Prisma.UsuarioWhereInput = {}
    if (dto.busca) {
      where.OR = [
        { nome: { contains: dto.busca, mode: 'insensitive' } },
        { email: { contains: dto.busca, mode: 'insensitive' } },
        { cpf: { contains: dto.busca.replace(/\D/g, '') } },
      ]
    }
    if (dto.status) where.status = dto.status
    if (dto.tipoVinculo) where.tipoVinculo = dto.tipoVinculo

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { nome: 'asc' },
        select: resumoSelect,
      }),
      this.prisma.usuario.count({ where }),
    ])

    return montarPaginado(itens, total, pagina, limite)
  }

  async buscarPorId(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { fichaFuncional: true, setor: true },
    })
    if (!usuario) throw new NotFoundException('Usuário não encontrado')
    return usuario
  }

  async atualizar(id: string, dto: AtualizarUsuarioDto, contexto: ContextoRequisicao) {
    await this.garantirExiste(id)
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dto.nome,
        telefone: dto.telefone,
        telefoneSecundario: dto.telefoneSecundario,
        emailSecundario: dto.emailSecundario,
      },
      select: resumoSelect,
    })
    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Usuario',
      entidadeId: id,
      valorNovo: dto,
    })
    return usuario
  }

  async alterarVinculo(id: string, dto: AlterarVinculoDto, contexto: ContextoRequisicao) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, matricula: true, tipoVinculo: true },
    })
    if (!usuario) throw new NotFoundException('Usuário não encontrado')

    // RN-CUD-061: matrícula só para efetivo/comissionado; estagiário/externo não têm
    let matricula: string | null
    if (this.vinculoSemMatricula(dto.tipoVinculo)) {
      matricula = null
    } else {
      matricula = dto.matricula?.trim() || usuario.matricula
    }
    this.validarMatricula(dto.tipoVinculo, matricula)

    const atualizado = await this.prisma.usuario.update({
      where: { id },
      data: { tipoVinculo: dto.tipoVinculo, matricula },
      select: resumoSelect,
    })
    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.MUDAR_VINCULO,
      entidade: 'Usuario',
      entidadeId: id,
      valorAnterior: { tipoVinculo: usuario.tipoVinculo },
      valorNovo: { tipoVinculo: dto.tipoVinculo },
    })
    return atualizado
  }

  async alterarStatus(id: string, status: StatusUsuario, contexto: ContextoRequisicao) {
    await this.garantirExiste(id)
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: { status, ativo: status === StatusUsuario.ATIVO },
      select: resumoSelect,
    })
    await this.auditoria.registrar(contexto, {
      acao:
        status === StatusUsuario.ATIVO
          ? AcaoAuditoria.ATIVAR_USUARIO
          : status === StatusUsuario.BLOQUEADO
            ? AcaoAuditoria.BLOQUEAR_USUARIO
            : AcaoAuditoria.ATUALIZAR,
      entidade: 'Usuario',
      entidadeId: id,
      valorNovo: { status },
    })
    return usuario
  }

  // ── auxiliares ──────────────────────────────────────────────

  private async criarComAuth(
    params: {
      nome: string
      email: string
      cpf: string
      matricula?: string
      telefone?: string
      tipoVinculo: TipoVinculo
      ehAdminGlobal: boolean
      senha?: string
    },
    contexto: ContextoRequisicao,
  ) {
    if (!validarCpf(params.cpf)) throw new BadRequestException('CPF inválido')
    this.validarMatricula(params.tipoVinculo, params.matricula)
    await this.garantirUnicidade(params.cpf, params.email, params.matricula)

    // RN-CUD-003: cria no Supabase Auth primeiro
    const { data, error } = await this.supabase.criarUsuarioAuth({
      email: params.email,
      senha: params.senha,
      metadata: {
        nome: params.nome,
        cpf: params.cpf,
        matricula: params.matricula,
      },
    })
    if (error || !data.user) {
      throw new BadRequestException(
        `Falha ao criar no Supabase Auth: ${error?.message ?? 'desconhecida'}`,
      )
    }

    let usuario: UsuarioResumo
    try {
      usuario = await this.prisma.usuario.create({
        data: {
          nome: params.nome,
          email: params.email,
          cpf: params.cpf,
          matricula: params.matricula,
          telefone: params.telefone,
          tipoVinculo: params.tipoVinculo,
          ehAdminGlobal: params.ehAdminGlobal,
          authId: data.user.id,
          status: StatusUsuario.PENDENTE_ATIVACAO,
        },
        select: resumoSelect,
      })
    } catch (erro) {
      // rollback total — sem identidade órfã (RN-CUD-003)
      await this.supabase.excluirUsuarioAuth(data.user.id)
      throw erro
    }

    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Usuario',
      entidadeId: usuario.id,
      valorNovo: {
        email: params.email,
        tipoVinculo: params.tipoVinculo,
      },
    })
    return usuario
  }

  // RN-CUD-061: matrícula existe só para efetivo/comissionado
  private vinculoExigeMatricula(tipo: TipoVinculo): boolean {
    return tipo === TipoVinculo.EFETIVO || tipo === TipoVinculo.COMISSIONADO
  }

  private vinculoSemMatricula(tipo: TipoVinculo): boolean {
    return tipo === TipoVinculo.ESTAGIARIO || tipo === TipoVinculo.EXTERNO
  }

  private validarMatricula(tipo: TipoVinculo, matricula?: string | null) {
    if (this.vinculoExigeMatricula(tipo) && !matricula?.trim()) {
      throw new BadRequestException(
        'Matrícula obrigatória para vínculo efetivo ou comissionado',
      )
    }
    if (this.vinculoSemMatricula(tipo) && matricula?.trim()) {
      throw new BadRequestException('Este vínculo não possui matrícula')
    }
  }

  private async garantirUnicidade(
    cpf: string,
    email: string,
    matricula?: string,
  ) {
    const condicoes: Prisma.UsuarioWhereInput[] = [{ cpf }, { email }]
    if (matricula) condicoes.push({ matricula })

    const existente = await this.prisma.usuario.findFirst({
      where: { OR: condicoes },
      select: { cpf: true, email: true, matricula: true },
    })
    if (!existente) return

    if (existente.cpf === cpf) throw new ConflictException('CPF já cadastrado')
    if (existente.email === email) throw new ConflictException('E-mail já cadastrado')
    throw new ConflictException('Matrícula já cadastrada')
  }

  private async garantirExiste(id: string) {
    const existe = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existe) throw new NotFoundException('Usuário não encontrado')
  }
}
