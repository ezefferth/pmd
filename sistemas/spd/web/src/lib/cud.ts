// Client HTTP para o CUD (autenticação e verificação de permissão).
const BASE = process.env.CUD_API_URL ?? 'http://localhost:3001/api/v1'
const SISTEMA = process.env.SISTEMA_SLUG ?? 'spd'

export interface RespostaLogin {
  accessToken: string
  usuario: { id: string; nome: string; email: string; ehAdminGlobal: boolean }
}

export async function autenticarNoCud(
  email: string,
  senha: string,
): Promise<RespostaLogin | null> {
  const resposta = await fetch(`${BASE}/autenticacao/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  if (!resposta.ok) return null
  return resposta.json() as Promise<RespostaLogin>
}

export interface PerfilCud {
  cpf: string | null
  nome: string
  email: string
}

/** Dados do próprio usuário no CUD (inclui CPF) — para espelhar localmente. */
export async function obterPerfilCud(token: string): Promise<PerfilCud | null> {
  const resposta = await fetch(`${BASE}/perfil`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!resposta.ok) return null
  return resposta.json() as Promise<PerfilCud>
}

/** Verifica permissão granular no CUD (RN-CUD-020). authId = sub do JWT. */
export async function verificarPermissao(
  authId: string,
  permissao: string,
): Promise<boolean> {
  const params = new URLSearchParams({
    usuarioId: authId,
    sistemaId: SISTEMA,
    permissao,
  })
  const resposta = await fetch(`${BASE}/acessos/verificar?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!resposta.ok) return false
  const dados = (await resposta.json()) as { temAcesso: boolean }
  return dados.temAcesso === true
}
