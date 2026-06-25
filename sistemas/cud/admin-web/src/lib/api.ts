import { cookies } from 'next/headers'

const BASE = process.env.AUTH_API_URL ?? 'http://localhost:3001/api/v1'

export const COOKIE_SESSAO = 'cud_token'

/** GET autenticado na auth-api usando o token do cookie de sessão (server-side). */
export async function apiGet<T>(caminho: string): Promise<T> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  const resposta = await fetch(`${BASE}${caminho}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  if (!resposta.ok) {
    throw new Error(`Falha ao consultar a auth-api (${resposta.status})`)
  }
  return resposta.json() as Promise<T>
}

export function urlAuthApi(caminho: string): string {
  return `${BASE}${caminho}`
}
