import Link from 'next/link'
import { SairButton } from '@/components/sair-button'
import { obterUsuarioAtual } from '@/lib/sessao'

const nav = [
  { href: '/', rotulo: 'Início' },
  { href: '/processos', rotulo: 'Processos' },
  { href: '/organograma', rotulo: 'Organograma' },
  { href: '/assuntos', rotulo: 'Assuntos' },
]

export default async function InternoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await obterUsuarioAtual()

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r p-4">
        <div className="mb-6 font-titulo text-lg font-bold text-secundaria">SPD</div>
        <nav className="space-y-1 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded px-3 py-2 hover:bg-black/5">
              {item.rotulo}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm opacity-70">{usuario?.nome ?? 'Protocolo Digital'}</span>
          <SairButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
