import { Injectable, UnauthorizedException } from '@nestjs/common'
import { StatusUsuario } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.autenticar(dto.email, dto.senha)
    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    // correlaciona o usuário do Supabase Auth (sub do JWT) com o registro local
    const usuario = await this.prisma.usuario.findUnique({
      where: { authId: data.user.id },
    })
    if (!usuario || !usuario.ativo || usuario.status !== StatusUsuario.ATIVO) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado')
    }

    return {
      accessToken: data.session.access_token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        ehAdminGlobal: usuario.ehAdminGlobal,
      },
    }
  }

  async recuperarSenha(email: string) {
    // delega ao Supabase Auth; resposta neutra para não revelar se o e-mail existe
    await this.supabase.enviarRecuperacaoSenha(email)
    return { mensagem: 'Se o e-mail estiver cadastrado, enviaremos instruções de recuperação.' }
  }
}
