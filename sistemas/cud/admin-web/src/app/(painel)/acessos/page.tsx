import { apiGet } from '@/lib/api'
import { revogarAcesso } from '@/actions/acessos'
import { FormToast } from '@/components/form-toast'
import { ConcederForm, type OpcaoPerfil } from './conceder-form'

interface Acesso {
  id: string
  ativo: boolean
  sistema: { nome: string }
  perfil: { nome: string }
}
interface UsuarioResumo {
  id: string
  nome: string
  email: string
}
interface ResultadoPaginado {
  itens: UsuarioResumo[]
}
interface Sistema {
  id: string
  nome: string
}
interface Perfil {
  id: string
  nome: string
}

export default async function AcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ usuarioId?: string }>
}) {
  const { usuarioId } = await searchParams

  const [paginado, sistemas] = await Promise.all([
    apiGet<ResultadoPaginado>('/usuarios?limite=100').catch(() => ({ itens: [] })),
    apiGet<Sistema[]>('/sistemas').catch(() => []),
  ])
  const usuarios = paginado.itens

  // perfis de todos os sistemas (para a cascata sistema→perfil)
  const perfisPorSistema = await Promise.all(
    sistemas.map((s) =>
      apiGet<Perfil[]>(`/perfis?sistemaId=${s.id}`)
        .then((lista) => lista.map((p) => ({ ...p, sistemaId: s.id })))
        .catch(() => [] as OpcaoPerfil[]),
    ),
  )
  const perfis: OpcaoPerfil[] = perfisPorSistema.flat()

  const acessos = usuarioId
    ? await apiGet<Acesso[]>(`/acessos/usuario/${usuarioId}`).catch(() => [])
    : []

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Acessos</h1>

      <form className="flex flex-wrap gap-2" action="/acessos" method="get">
        <select name="usuarioId" defaultValue={usuarioId ?? ''} className="w-96 rounded border px-3 py-2 text-sm">
          <option value="">Selecione um usuário…</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nome} — {u.email}</option>
          ))}
        </select>
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
              {acessos.length === 0 && (
                <tr><td className="px-3 py-3 opacity-60" colSpan={3}>Sem acessos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ConcederForm usuarios={usuarios} sistemas={sistemas} perfis={perfis} />

        <FormToast acao={revogarAcesso} sucesso="Acesso revogado" carregando="Revogando…" className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Revogar acesso</h2>
          <select name="usuarioId" defaultValue="" required className="w-full rounded border px-3 py-2 text-sm">
            <option value="" disabled>Usuário…</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nome} — {u.email}</option>
            ))}
          </select>
          <select name="sistemaId" defaultValue="" required className="w-full rounded border px-3 py-2 text-sm">
            <option value="" disabled>Sistema…</option>
            {sistemas.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          <button className="rounded border px-4 py-2 text-sm font-medium">
            Revogar
          </button>
        </FormToast>
      </div>
    </section>
  )
}
