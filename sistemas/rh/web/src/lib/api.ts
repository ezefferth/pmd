const BASE = process.env.RH_API_URL ?? 'http://localhost:3005/api/v1'

/** GET na api do RH (server-side). A api do RH é aberta no MVP (sem auth). */
export async function apiGet<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, { cache: 'no-store' })
  if (!resposta.ok) {
    throw new Error(`Falha ao consultar a api do RH (${resposta.status})`)
  }
  return resposta.json() as Promise<T>
}

/** POST/PATCH/DELETE na api do RH (server-side). */
export async function apiSend<T = unknown>(
  metodo: 'POST' | 'PATCH' | 'DELETE',
  caminho: string,
  corpo?: unknown,
): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers: { 'content-type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: 'no-store',
  })
  if (!resposta.ok) {
    const texto = await resposta.text()
    throw new Error(`Falha ${resposta.status}: ${texto}`)
  }
  return resposta.json().catch(() => ({})) as Promise<T>
}
