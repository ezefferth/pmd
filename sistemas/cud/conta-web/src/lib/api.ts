import { cookies } from 'next/headers'

const BASE = process.env.AUTH_API_URL ?? 'http://localhost:3001/api/v1'

export const COOKIE_SESSAO = 'cud_token'

export async function apiGet<T>(caminho: string): Promise<T> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  const resposta = await fetch(`${BASE}${caminho}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })
  if (!resposta.ok) throw new Error(`Falha ${resposta.status}`)
  return resposta.json() as Promise<T>
}

/** POST/PATCH autenticado (ou público quando não há cookie). */
export async function apiSend<T = unknown>(
  metodo: 'POST' | 'PATCH' | 'DELETE',
  caminho: string,
  corpo?: unknown,
): Promise<T> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  const resposta = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: 'no-store',
  })
  if (!resposta.ok) {
    throw new Error(`Falha ${resposta.status}: ${await resposta.text()}`)
  }
  return resposta.json().catch(() => ({})) as Promise<T>
}

export function urlAuthApi(caminho: string): string {
  return `${BASE}${caminho}`
}
