import Link from 'next/link'
import { apiGet } from '@/lib/api'

interface ResultadoPaginado {
  total: number
}

async function obterTotalUsuarios(): Promise<number | null> {
  try {
    const dados = await apiGet<ResultadoPaginado>('/usuarios?limite=1')
    return dados.total
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const total = await obterTotalUsuarios()

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold text-secundaria">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/usuarios"
          className="rounded-lg border p-4 hover:border-primaria"
        >
          <div className="text-sm opacity-70">Usuários</div>
          <div className="text-3xl font-bold text-primaria">
            {total ?? '—'}
          </div>
        </Link>
      </div>
    </section>
  )
}
