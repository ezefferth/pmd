import { prisma } from '@/lib/prisma'
import { criarNivel, criarUnidade } from '@/actions/organograma'

export default async function OrganogramaPage() {
  const [niveis, unidades] = await Promise.all([
    prisma.nivelOrganograma.findMany({ orderBy: { nivel: 'asc' } }),
    prisma.organograma.findMany({
      orderBy: { codigo: 'asc' },
      include: { nivel: true },
    }),
  ])

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Organograma</h1>

      {/* Níveis */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold">Níveis</h2>
          <ul className="rounded-lg border text-sm">
            {niveis.map((n) => (
              <li key={n.id} className="border-b px-3 py-2 last:border-0">
                {n.nivel} — {n.nome}
              </li>
            ))}
            {niveis.length === 0 && <li className="px-3 py-2 opacity-60">Nenhum nível.</li>}
          </ul>
        </div>
        <form action={criarNivel} className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Novo nível</h2>
          <input name="nivel" type="number" min={1} placeholder="Número (1..5)" required className="w-full rounded border px-3 py-2 text-sm" />
          <input name="nome" placeholder="Nome (ex.: Secretaria)" required className="w-full rounded border px-3 py-2 text-sm" />
          <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Criar nível</button>
        </form>
      </div>

      {/* Unidades */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold">Unidades</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Sigla</th>
                  <th className="px-3 py-2">Nível</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2 font-mono">{u.codigo}</td>
                    <td className="px-3 py-2">{u.sigla}</td>
                    <td className="px-3 py-2">{u.nivel.nome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <form action={criarUnidade} className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Nova unidade</h2>
          <input name="codigo" placeholder="Código (ex.: 001.001)" required className="w-full rounded border px-3 py-2 text-sm" />
          <input name="sigla" placeholder="Sigla (ex.: SEMFAZ)" className="w-full rounded border px-3 py-2 text-sm" />
          <select name="nivelId" required className="w-full rounded border px-3 py-2 text-sm">
            <option value="">Nível…</option>
            {niveis.map((n) => (
              <option key={n.id} value={n.id}>{n.nivel} — {n.nome}</option>
            ))}
          </select>
          <select name="paiId" className="w-full rounded border px-3 py-2 text-sm">
            <option value="">Sem pai (raiz)</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>{u.codigo} {u.sigla ?? ''}</option>
            ))}
          </select>
          <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Criar unidade</button>
        </form>
      </div>
    </section>
  )
}
