import { apiGet } from '@/lib/api'
import { criarSistema } from '@/actions/sistemas'
import { FormToast } from '@/components/form-toast'

interface Sistema {
  id: string
  nome: string
  slug: string
  ativo: boolean
  urlBase?: string
}

export default async function SistemasPage() {
  let sistemas: Sistema[] = []
  let erro = false
  try {
    sistemas = await apiGet<Sistema[]>('/sistemas')
  } catch {
    erro = true
  }

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Sistemas</h1>

      {erro && <p className="text-sm text-red-600">Não foi possível carregar.</p>}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {sistemas.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2">{s.nome}</td>
                <td className="px-3 py-2 font-mono">{s.slug}</td>
                <td className="px-3 py-2">{s.ativo ? 'sim' : 'não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormToast
        acao={criarSistema}
        sucesso="Sistema registrado"
        className="max-w-md space-y-3 rounded-lg border p-4"
      >
        <h2 className="font-semibold">Novo sistema</h2>
        <input name="nome" placeholder="Nome" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="slug" placeholder="slug (ex.: spd)" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="urlBase" placeholder="URL base (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
        <input name="descricao" placeholder="Descrição (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">
          Registrar
        </button>
      </FormToast>
    </section>
  )
}
