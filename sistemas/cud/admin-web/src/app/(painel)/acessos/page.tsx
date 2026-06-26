import { apiGet } from '@/lib/api'
import { concederAcesso, revogarAcesso } from '@/actions/acessos'
import { FormToast } from '@/components/form-toast'

interface Acesso {
  id: string
  ativo: boolean
  sistema: { nome: string }
  perfil: { nome: string }
}

export default async function AcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ usuarioId?: string }>
}) {
  const { usuarioId } = await searchParams
  const acessos = usuarioId
    ? await apiGet<Acesso[]>(`/acessos/usuario/${usuarioId}`).catch(() => [])
    : []

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Acessos</h1>

      <form className="flex gap-2" action="/acessos" method="get">
        <input
          name="usuarioId"
          defaultValue={usuarioId}
          placeholder="ID do usuário (CUD)"
          className="w-80 rounded border px-3 py-2 text-sm"
        />
        <button className="rounded border px-4 py-2 text-sm">Ver acessos</button>
      </form>

      {usuarioId && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-3 py-2">Sistema</th>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {acessos.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2">{a.sistema?.nome}</td>
                  <td className="px-3 py-2">{a.perfil?.nome}</td>
                  <td className="px-3 py-2">{a.ativo ? 'sim' : 'não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <FormToast acao={concederAcesso} sucesso="Acesso concedido" className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Conceder acesso</h2>
          <input name="usuarioId" placeholder="usuarioId" required className="w-full rounded border px-3 py-2 text-sm" />
          <input name="sistemaId" placeholder="sistemaId" required className="w-full rounded border px-3 py-2 text-sm" />
          <input name="perfilId" placeholder="perfilId" required className="w-full rounded border px-3 py-2 text-sm" />
          <input name="motivo" placeholder="Motivo (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
          <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">
            Conceder
          </button>
        </FormToast>

        <FormToast acao={revogarAcesso} sucesso="Acesso revogado" carregando="Revogando…" className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Revogar acesso</h2>
          <input name="usuarioId" placeholder="usuarioId" required className="w-full rounded border px-3 py-2 text-sm" />
          <input name="sistemaId" placeholder="sistemaId" required className="w-full rounded border px-3 py-2 text-sm" />
          <button className="rounded border px-4 py-2 text-sm font-medium">
            Revogar
          </button>
        </FormToast>
      </div>
    </section>
  )
}
