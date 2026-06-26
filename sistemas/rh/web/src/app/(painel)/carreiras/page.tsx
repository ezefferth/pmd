import { apiGet } from '@/lib/api'
import { FormToast } from '@/components/form-toast'
import { criarCarreira, adicionarFaixa } from '@/actions/carreiras'

interface Faixa {
  id: string
  classe: string
  referencia: string
  vencimentoBase: number | string
}
interface Carreira {
  id: string
  nome: string
  descricao: string | null
  leiReferencia: string | null
  faixas: Faixa[]
}

function moeda(valor: number | string): string {
  const n = typeof valor === 'string' ? Number(valor) : valor
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function CarreirasPage() {
  const carreiras = await apiGet<Carreira[]>('/carreiras').catch(() => [])

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Carreiras</h1>

      <div className="space-y-4">
        {carreiras.length === 0 && <p className="text-sm opacity-70">Nenhuma carreira cadastrada.</p>}
        {carreiras.map((c) => (
          <div key={c.id} className="rounded-lg border p-4">
            <div className="font-semibold">{c.nome}</div>
            {c.descricao && <p className="text-sm opacity-70">{c.descricao}</p>}
            {c.leiReferencia && <p className="text-xs opacity-50">Lei: {c.leiReferencia}</p>}

            {c.faixas.length > 0 && (
              <table className="mt-3 w-full max-w-md text-sm">
                <thead className="text-left opacity-60">
                  <tr><th className="py-1">Classe</th><th className="py-1">Referência</th><th className="py-1">Vencimento</th></tr>
                </thead>
                <tbody>
                  {c.faixas.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="py-1">{f.classe}</td>
                      <td className="py-1">{f.referencia}</td>
                      <td className="py-1">{moeda(f.vencimentoBase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <FormToast acao={adicionarFaixa} sucesso="Faixa adicionada" carregando="Adicionando…" className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="carreiraId" value={c.id} />
              <input name="classe" placeholder="Classe" required className="w-24 rounded border px-2 py-1 text-sm" />
              <input name="referencia" placeholder="Referência" required className="w-28 rounded border px-2 py-1 text-sm" />
              <input name="vencimentoBase" type="number" step="0.01" placeholder="Vencimento" required className="w-32 rounded border px-2 py-1 text-sm" />
              <button className="rounded border px-3 py-1 text-sm">+ Faixa</button>
            </FormToast>
          </div>
        ))}
      </div>

      <FormToast acao={criarCarreira} sucesso="Carreira criada" className="max-w-md space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Nova carreira</h2>
        <input name="nome" placeholder="Nome" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="descricao" placeholder="Descrição (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
        <input name="leiReferencia" placeholder="Lei de referência (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Criar</button>
      </FormToast>
    </section>
  )
}
