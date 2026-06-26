import Link from 'next/link'
import { cadastrar } from '@/actions/conta'

export default function CadastroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={cadastrar} className="w-full max-w-sm space-y-3 rounded-lg border p-6 shadow-sm">
        <h1 className="text-xl font-bold text-secundaria">Criar conta</h1>
        <input name="nome" placeholder="Nome completo" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="cpf" placeholder="CPF" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="E-mail" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="senha" type="password" placeholder="Senha (mín. 8)" required minLength={8} className="w-full rounded border px-3 py-2 text-sm" />
        <button className="w-full rounded bg-primaria py-2 font-medium text-white">Cadastrar</button>
        <p className="text-center text-sm">
          <Link href="/login" className="underline">Já tenho conta</Link>
        </p>
        <p className="text-xs opacity-60">Após o cadastro, verifique seu e-mail para ativar a conta.</p>
      </form>
    </main>
  )
}
