import Link from 'next/link'

const nav = [
  { href: '/', rotulo: 'Início' },
  { href: '/unidades', rotulo: 'Unidades' },
  { href: '/carreiras', rotulo: 'Carreiras' },
  { href: '/cargos', rotulo: 'Cargos' },
  { href: '/servidores', rotulo: 'Servidores' },
]

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r p-4">
        <div className="mb-6 font-titulo text-lg font-bold text-secundaria">RH</div>
        <nav className="space-y-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 hover:bg-black/5"
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm opacity-70">Recursos Humanos</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
