import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_SESSAO, urlAuthApi } from '@/lib/api'

const UMA_HORA = 60 * 60

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json()
  const resposta = await fetch(urlAuthApi('/autenticacao/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  if (!resposta.ok) {
    return NextResponse.json({ erro: 'Credenciais inválidas' }, { status: 401 })
  }
  const dados = await resposta.json()
  const saida = NextResponse.json({ ok: true })
  saida.cookies.set(COOKIE_SESSAO, dados.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: UMA_HORA,
  })
  return saida
}

export async function DELETE() {
  const saida = NextResponse.json({ ok: true })
  saida.cookies.set(COOKIE_SESSAO, '', { httpOnly: true, path: '/', maxAge: 0 })
  return saida
}
