import { obterUsuarioAtual } from '@/lib/sessao'
import { SairButton } from '@/components/sair-button'

export default async function HomePage() {
  const usuario = await obterUsuarioAtual()

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secundaria">Protocolo Digital</h1>
        <SairButton />
      </header>
      <p className="opacity-70">
        Olá, <strong>{usuario?.nome ?? 'usuário'}</strong>. Autenticado via Central de Usuários (CUD).
      </p>
      <p className="text-sm opacity-60">
        Em construção. Próximos: portal do cidadão, área interna, cadastros e abertura de processo.
      </p>
    </main>
  )
}
