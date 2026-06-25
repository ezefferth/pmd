import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { Usuario } from '@prisma/client'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RecuperarSenhaDto } from './dto/recuperar-senha.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { UsuarioAtual } from './decorators/usuario-atual.decorator'

@Controller('autenticacao')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('recuperar-senha')
  recuperarSenha(@Body() dto: RecuperarSenhaDto) {
    return this.auth.recuperarSenha(dto.email)
  }

  @UseGuards(JwtAuthGuard)
  @Get('eu')
  eu(@UsuarioAtual() usuario: Usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      ehAdminGlobal: usuario.ehAdminGlobal,
    }
  }
}
