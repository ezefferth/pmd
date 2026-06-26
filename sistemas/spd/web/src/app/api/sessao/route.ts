import { NextRequest, NextResponse } from 'next/server'
import { autenticarNoCud } from '@/lib/cud'
import { COOKIE_SESSAO, lerAuthIdDoToken } from '@/lib/sessao'
import { prisma } from '@/lib/prisma'

const UMA_HORA = 60 * 60

// Login via CUD: valida no CUD, espelha o usuário localmente e grava cookie httpOnly
export async function POST(req: NextRequest) {
  const { email, senha } = await req.json()

  const dados = await autenticarNoCud(email, senha)
  if (!dados) {
    return NextResponse.json({ erro: 'Credenciais inválidas' }, { status: 401 })
  }

  const authId = await lerAuthIdDoToken(dados.accessToken)
  if (!authId) {
    return NextResponse.json({ erro: 'Token inválido' }, { status: 401 })
  }

  // espelho local da identidade do CUD (RN: identidade é do CUD)
  await prisma.usuario.upsert({
    where: { authId },
    create: { authId, nome: dados.usuario.nome, email: dados.usuario.email },
    update: { nome: dados.usuario.nome, email: dados.usuario.email },
  })

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
