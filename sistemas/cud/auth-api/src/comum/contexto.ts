import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Usuario } from '@prisma/client'

/** Contexto da requisição para regras de escopo e auditoria. */
export interface ContextoRequisicao {
  ator: Usuario | null
  enderecoIp?: string
  userAgent?: string
}

/**
 * Extrai o contexto da requisição: ator (populado pelo JwtAuthGuard), IP e user-agent.
 * Em rotas públicas, `ator` é null.
 */
export const Contexto = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): ContextoRequisicao => {
    const req = ctx.switchToHttp().getRequest()
    return {
      ator: req.usuario ?? null,
      enderecoIp: req.ip,
      userAgent: req.headers?.['user-agent'],
    }
  },
)
