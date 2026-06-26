import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AcaoAuditoria, Usuario } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { AuditoriaService } from '../auditoria/auditoria.service'
import { ContextoRequisicao } from '../comum/contexto'
import { AtualizarPerfilProprioDto } from './dto/atualizar-perfil-proprio.dto'
import { AlterarEmailDto } from './dto/alterar-email.dto'

@Injectable()
export class PerfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async obter(usuarioId: string) {
    const perfil = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        emailSecundario: true,
        telefone: true,
        telefoneSecundario: true,
        status: true,
        tipoVinculo: true,
        setor: { select: { id: true, nome: true } },
        fichaFuncional: {
          select: { matricula: true, cargo: true, situacaoFuncional: true },
        },
      },
    })
    if (!perfil) throw new NotFoundException('Perfil não encontrado')
    return perfil
  }

  async atualizar(
    usuarioId: string,
    dto: AtualizarPerfilProprioDto,
    contexto: ContextoRequisicao,
  ) {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nome: dto.nome,
        telefone: dto.telefone,
        telefoneSecundario: dto.telefoneSecundario,
        emailSecundario: dto.emailSecundario,
      },
    })
    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Usuario',
      entidadeId: usuarioId,
      valorNovo: dto,
    })
    return this.obter(usuarioId)
  }

  async alterarSenha(
    usuario: Usuario,
    senha: string,
    contexto: ContextoRequisicao,
  ) {
    if (!usuario.authId) throw new BadRequestException('Usuário sem credencial')
    const { error } = await this.supabase.atualizarSenha(usuario.authId, senha)
    if (error) throw new BadRequestException('Falha ao alterar senha')
    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.REDEFINIR_SENHA,
      entidade: 'Usuario',
      entidadeId: usuario.id,
    })
    return { mensagem: 'Senha alterada' }
  }

  // RN-084: troca de e-mail exige nova validação (email_confirm=false no GoTrue)
  async alterarEmail(
    usuario: Usuario,
    dto: AlterarEmailDto,
    contexto: ContextoRequisicao,
  ) {
    if (!usuario.authId) throw new BadRequestException('Usuário sem credencial')

    const jaUsado = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      select: { id: true },
    })
    if (jaUsado && jaUsado.id !== usuario.id) {
      throw new BadRequestException('E-mail já em uso')
    }

    const { error } = await this.supabase.atualizarEmail(usuario.authId, dto.email)
    if (error) throw new BadRequestException('Falha ao alterar e-mail')

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { email: dto.email },
    })
    await this.auditoria.registrar(contexto, {
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Usuario',
      entidadeId: usuario.id,
      valorNovo: { email: dto.email },
    })
    return { mensagem: 'E-mail alterado — verifique a caixa de entrada para confirmar.' }
  }
}
