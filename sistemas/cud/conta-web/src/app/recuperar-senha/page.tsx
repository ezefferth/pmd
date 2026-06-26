import Link from 'next/link'
import { recuperarSenha } from '@/actions/conta'

export default function RecuperarSenhaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={recuperarSenha} className="w-full max-w-sm space-y-3 rounded-lg border p-6 shadow-sm">
        <h1 className="text-xl font-bold text-secundaria">Recuperar senha</h1>
        <p className="text-sm opacity-70">Enviaremos instruções para o seu e-mail.</p>
        <input name="email" type="email" placeholder="E-mail" required className="w-full rounded border px-3 py-2 text-sm" />
        <button className="w-full rounded bg-primaria py-2 font-medium text-white">Enviar</button>
        <p className="text-center text-sm">
          <Link href="/login" className="underline">Voltar ao login</Link>
        </p>
      </form>
    </main>
  )
}
