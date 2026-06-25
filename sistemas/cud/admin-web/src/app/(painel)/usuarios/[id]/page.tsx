import Link from 'next/link'
import { apiGet } from '@/lib/api'
import {
  alterarStatusUsuario,
  alterarVinculoUsuario,
} from '@/actions/usuarios'

const VINCULOS = [
  'EXTERNO',
  'EFETIVO',
  'COMISSIONADO',
  'ESTAGIARIO',
  'ELETIVO',
  'TEMPORARIO',
]
const STATUS = ['PENDENTE_ATIVACAO', 'ATIVO', 'INATIVO', 'BLOQUEADO']

interface UsuarioDetalhe {
  id: string
  nome: string
  email: string
  cpf: string
  status: string
  tipoVinculo: string
  matricula: string | null
  setor?: { nome: string } | null
}
interface Acesso {
  id: string
  ativo: boolean
  sistema: { nome: string }
  perfil: { nome: string; permissoes: string[] }
}

export default async function UsuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const usuario = await apiGet<UsuarioDetalhe>(`/usuarios/${id}`).catch(
    () => null,
  )
  const acessos = await apiGet<Acesso[]>(`/acessos/usuario/${id}`).catch(
    () => [],
  )

  if (!usuario) {
    return <p className="text-sm text-red-600">Usuário não encontrado.</p>
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secundaria">{usuario.nome}</h1>
        <Link href="/usuarios" className="text-sm underline">
          voltar
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm md:max-w-lg">
        <dt className="opacity-60">E-mail</dt>
        <dd>{usuario.email}</dd>
        <dt className="opacity-60">CPF</dt>
        <dd>{usuario.cpf}</dd>
        <dt className="opacity-60">Vínculo</dt>
        <dd>{usuario.tipoVinculo}</dd>
        <dt className="opacity-60">Matrícula</dt>
        <dd>{usuario.matricula ?? '—'}</dd>
        <dt className="opacity-60">Status</dt>
        <dd>{usuario.status}</dd>
        <dt className="opacity-60">Setor</dt>
        <dd>{usuario.setor?.nome ?? '—'}</dd>
      </dl>

      <div className="grid gap-6 md:grid-cols-2">
        <form action={alterarStatusUsuario} className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Alterar status</h2>
          <input type="hidden" name="id" value={usuario.id} />
          <select name="status" defaultValue={usuario.status} className="w-full rounded border px-3 py-2 text-sm">
            {STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="rounded border px-4 py-2 text-sm font-medium">Salvar</button>
        </form>

        <form action={alterarVinculoUsuario} className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Alterar vínculo</h2>
          <input type="hidden" name="id" value={usuario.id} />
          <select name="tipoVinculo" defaultValue={usuario.tipoVinculo} className="w-full rounded border px-3 py-2 text-sm">
            {VINCULOS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <input name="matricula" placeholder="Matrícula (efetivo/comissionado)" className="w-full rounded border px-3 py-2 text-sm" />
          <button className="rounded border px-4 py-2 text-sm font-medium">Salvar</button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Acessos (sistemas e permissões)</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-3 py-2">Sistema</th>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Permissões</th>
              </tr>
            </thead>
            <tbody>
              {acessos.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2">{a.sistema?.nome}</td>
                  <td className="px-3 py-2">{a.perfil?.nome}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {a.perfil?.permissoes?.join(', ')}
                  </td>
                </tr>
              ))}
              {acessos.length === 0 && (
                <tr>
                  <td className="px-3 py-3 opacity-60" colSpan={3}>
                    Sem acessos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
