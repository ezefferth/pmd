import Link from 'next/link'
import { apiGet } from '@/lib/api'
import { criarPerfil } from '@/actions/perfis'
import { FormToast } from '@/components/form-toast'

interface Sistema {
  id: string
  nome: string
  slug: string
}
interface Perfil {
  id: string
  nome: string
  slug: string
  permissoes: string[]
  permiteExterno: boolean
  ehAdministrativo: boolean
}

export default async function PerfisPage({
  searchParams,
}: {
  searchParams: Promise<{ sistemaId?: string }>
}) {
  const { sistemaId } = await searchParams
  const sistemas = await apiGet<Sistema[]>('/sistemas').catch(() => [])
  const perfis = sistemaId
    ? await apiGet<Perfil[]>(`/perfis?sistemaId=${sistemaId}`).catch(() => [])
    : []

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Perfis</h1>

      <div className="flex flex-wrap gap-2">
        {sistemas.map((s) => (
          <Link
            key={s.id}
            href={`/perfis?sistemaId=${s.id}`}
            className={`rounded border px-3 py-1 text-sm ${
              s.id === sistemaId ? 'bg-primaria text-white' : 'hover:bg-black/5'
            }`}
          >
            {s.nome}
          </Link>
        ))}
      </div>

      {!sistemaId && (
        <p className="text-sm opacity-70">Selecione um sistema acima.</p>
      )}

      {sistemaId && (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="px-3 py-2">Perfil</th>
                  <th className="px-3 py-2">Permissões</th>
                  <th className="px-3 py-2">Externo?</th>
                </tr>
              </thead>
              <tbody>
                {perfis.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">{p.nome}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {p.permissoes.join(', ')}
                    </td>
                    <td className="px-3 py-2">{p.permiteExterno ? 'sim' : 'não'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <FormToast
            acao={criarPerfil}
            sucesso="Perfil criado"
            className="max-w-md space-y-3 rounded-lg border p-4"
          >
            <h2 className="font-semibold">Novo perfil</h2>
            <input type="hidden" name="sistemaId" value={sistemaId} />
            <input name="nome" placeholder="Nome" required className="w-full rounded border px-3 py-2 text-sm" />
            <input name="slug" placeholder="slug (ex.: gestor-spd)" required className="w-full rounded border px-3 py-2 text-sm" />
            <textarea name="permissoes" placeholder="Permissões: PROCESSOS:CRIAR, PROCESSOS:LER  (ou *)" required className="w-full rounded border px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="permiteExterno" /> Permite externo
            </label>
            <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">
              Criar perfil
            </button>
          </FormToast>
        </>
      )}
    </section>
  )
}
