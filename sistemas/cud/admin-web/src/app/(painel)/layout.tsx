import Link from 'next/link'
import { SairButton } from '@/components/sair-button'

const navAtiva = [
  { href: '/', rotulo: 'Dashboard' },
  { href: '/usuarios', rotulo: 'Usuários' },
  { href: '/sistemas', rotulo: 'Sistemas' },
  { href: '/perfis', rotulo: 'Perfis' },
  { href: '/acessos', rotulo: 'Acessos' },
  { href: '/auditoria', rotulo: 'Auditoria' },
  { href: '/configuracoes', rotulo: 'Configurações' },
]
const navEmBreve: string[] = []

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r p-4">
        <div className="mb-6 font-titulo text-lg font-bold text-secundaria">
          CUD
        </div>
        <nav className="space-y-1 text-sm">
          {navAtiva.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 hover:bg-black/5"
            >
              {item.rotulo}
            </Link>
          ))}
          {navEmBreve.map((rotulo) => (
            <span
              key={rotulo}
              className="block cursor-not-allowed px-3 py-2 opacity-40"
            >
              {rotulo}
            </span>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm opacity-70">Gerenciador de Usuários</span>
          <SairButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
