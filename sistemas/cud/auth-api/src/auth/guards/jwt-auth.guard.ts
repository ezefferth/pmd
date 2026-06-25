import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { StatusUsuario } from '@prisma/client'
import { jwtVerify } from 'jose'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly segredo: Uint8Array

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // JWT do Supabase Auth é HS256 assinado com o JWT_SECRET do projeto
    this.segredo = new TextEncoder().encode(
      this.config.getOrThrow<string>('JWT_SECRET'),
    )
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const cabecalho: string | undefined = req.headers?.authorization
    if (!cabecalho?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente')
    }

    const token = cabecalho.slice('Bearer '.length)
    let sub: string | undefined
    try {
      const { payload } = await jwtVerify(token, this.segredo)
      sub = typeof payload.sub === 'string' ? payload.sub : undefined
    } catch {
      throw new UnauthorizedException('Token inválido')
    }
    if (!sub) throw new UnauthorizedException('Token sem identificação')

    const usuario = await this.prisma.usuario.findUnique({ where: { authId: sub } })
    if (!usuario || usuario.status !== StatusUsuario.ATIVO) {
      throw new UnauthorizedException('Usuário sem acesso')
    }

    req.usuario = usuario
    return true
  }
}
