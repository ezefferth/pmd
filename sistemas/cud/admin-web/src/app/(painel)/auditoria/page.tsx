import { apiGet } from '@/lib/api'

interface LogAuditoria {
  id: string
  acao: string
  entidade: string
  entidadeId: string
  atorId: string | null
  criadoEm: string
}
interface Paginado {
  itens: LogAuditoria[]
  total: number
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; entidade?: string }>
}) {
  const sp = await searchParams
  const qs = new URLSearchParams({ limite: '30' })
  if (sp.acao) qs.set('acao', sp.acao)
  if (sp.entidade) qs.set('entidade', sp.entidade)

  const dados = await apiGet<Paginado>(`/auditoria?${qs.toString()}`).catch(
    () => null,
  )

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-secundaria">Auditoria</h1>

      <form className="flex flex-wrap gap-2" action="/auditoria" method="get">
        <input name="entidade" defaultValue={sp.entidade} placeholder="Entidade (ex.: Usuario)" className="rounded border px-3 py-2 text-sm" />
        <input name="acao" defaultValue={sp.acao} placeholder="Ação (ex.: CRIAR)" className="rounded border px-3 py-2 text-sm" />
        <button className="rounded border px-4 py-2 text-sm">Filtrar</button>
      </form>

      {!dados && <p className="text-sm text-red-600">Não foi possível carregar.</p>}

      {dados && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-3 py-2">Quando</th>
                <th className="px-3 py-2">Ação</th>
                <th className="px-3 py-2">Entidade</th>
                <th className="px-3 py-2">Ator</th>
              </tr>
            </thead>
            <tbody>
              {dados.itens.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-3 py-2">{new Date(log.criadoEm).toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.acao}</td>
                  <td className="px-3 py-2">{log.entidade}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.atorId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
