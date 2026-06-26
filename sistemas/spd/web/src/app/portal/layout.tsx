import Link from 'next/link'
import { SairButton } from '@/components/sair-button'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/portal" className="font-titulo font-bold text-secundaria">
            Portal do Cidadão
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/portal/abrir" className="hover:underline">Abrir processo</Link>
            <Link href="/portal/meus-processos" className="hover:underline">Meus processos</Link>
            <SairButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  )
}
