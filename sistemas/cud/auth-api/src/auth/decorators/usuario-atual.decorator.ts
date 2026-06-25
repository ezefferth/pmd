import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Usuario } from '@prisma/client'

/** Injeta o usuário autenticado (populado pelo JwtAuthGuard) no handler. */
export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): Usuario => {
    return ctx.switchToHttp().getRequest().usuario
  },
)
