import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { Usuario } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator'
import { Contexto, ContextoRequisicao } from '../comum/contexto'
import { PerfilService } from './perfil.service'
import { AtualizarPerfilProprioDto } from './dto/atualizar-perfil-proprio.dto'
import { AlterarSenhaDto } from './dto/alterar-senha.dto'
import { AlterarEmailDto } from './dto/alterar-email.dto'

// Perfil do próprio usuário autenticado (externo ou interno)
@UseGuards(JwtAuthGuard)
@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfil: PerfilService) {}

  @Get()
  obter(@UsuarioAtual() usuario: Usuario) {
    return this.perfil.obter(usuario.id)
  }

  @Patch()
  atualizar(
    @UsuarioAtual() usuario: Usuario,
    @Body() dto: AtualizarPerfilProprioDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.perfil.atualizar(usuario.id, dto, contexto)
  }

  @Post('senha')
  alterarSenha(
    @UsuarioAtual() usuario: Usuario,
    @Body() dto: AlterarSenhaDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.perfil.alterarSenha(usuario, dto.senha, contexto)
  }

  @Post('email')
  alterarEmail(
    @UsuarioAtual() usuario: Usuario,
    @Body() dto: AlterarEmailDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.perfil.alterarEmail(usuario, dto, contexto)
  }
}
