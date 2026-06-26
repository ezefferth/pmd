import Link from 'next/link'
import { apiGet } from '@/lib/api'

interface ResultadoPaginado {
  total: number
}
interface Item {
  id: string
}

async function contar(caminho: string): Promise<number | null> {
  try {
    const dados = await apiGet<ResultadoPaginado | Item[]>(caminho)
    if (Array.isArray(dados)) return dados.length
    return dados.total
  } catch {
    return null
  }
}

const cards = [
  { href: '/servidores', rotulo: 'Servidores', caminho: '/servidores?limite=1' },
  { href: '/unidades', rotulo: 'Unidades', caminho: '/unidades' },
  { href: '/cargos', rotulo: 'Cargos', caminho: '/cargos' },
  { href: '/carreiras', rotulo: 'Carreiras', caminho: '/carreiras' },
]

export default async function DashboardPage() {
  const totais = await Promise.all(cards.map((c) => contar(c.caminho)))

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold text-secundaria">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Link key={c.href} href={c.href} className="rounded-lg border p-4 hover:border-primaria">
            <div className="text-sm opacity-70">{c.rotulo}</div>
            <div className="text-3xl font-bold text-primaria">{totais[i] ?? '—'}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
