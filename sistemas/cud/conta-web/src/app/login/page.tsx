'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro('')
    const resposta = await fetch('/api/sessao', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })
    if (resposta.ok) {
      router.push('/')
      router.refresh()
    } else {
      setErro('Credenciais inválidas')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm">
        <h1 className="text-xl font-bold text-secundaria">Minha Conta</h1>
        <label className="block text-sm">
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button className="w-full rounded bg-primaria py-2 font-medium text-white">Entrar</button>
        <div className="flex justify-between text-sm">
          <Link href="/cadastro" className="underline">Criar conta</Link>
          <Link href="/recuperar-senha" className="underline">Esqueci a senha</Link>
        </div>
      </form>
    </main>
  )
}
