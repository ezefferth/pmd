import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from './prisma'

export const COOKIE_SESSAO = 'spd_token'

function segredo(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? '')
}

/** Valida o JWT do Supabase (do CUD) e retorna o `sub` (authId). */
export async function lerAuthIdDoToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, segredo())
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

/** Usuário autenticado (espelho local, correlacionado pelo authId do CUD). */
export async function obterUsuarioAtual() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  if (!token) return null
  const authId = await lerAuthIdDoToken(token)
  if (!authId) return null
  return prisma.usuario.findUnique({ where: { authId } })
}
