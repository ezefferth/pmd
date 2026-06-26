import Link from 'next/link'
import { apiGet } from '@/lib/api'
import { FormToast } from '@/components/form-toast'
import { criarServidor } from '@/actions/servidores'

const VINCULOS = ['EFETIVO', 'COMISSIONADO', 'ESTAGIARIO', 'ELETIVO', 'TEMPORARIO']
const REGIMES = ['ESTATUTARIO', 'CELETISTA', 'ESPECIAL']
const SITUACOES = ['ATIVO', 'FERIAS', 'AFASTADO', 'LICENCA', 'CEDIDO', 'VACANCIA', 'EXONERADO', 'APOSENTADO']

interface ServidorResumo {
  id: string
  nome: string
  cpf: string
  matricula: string | null
  tipoVinculo: string
  situacao: string
}
interface Paginado {
  itens: ServidorResumo[]
  total: number
  pagina: number
  totalPaginas: number
}
interface Opcao {
  id: string
  nome: string
  sigla?: string | null
}

export default async function ServidoresPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; situacao?: string; pagina?: string }>
}) {
  const sp = await searchParams
  const params = new URLSearchParams()
  if (sp.busca) params.set('busca', sp.busca)
  if (sp.situacao && SITUACOES.includes(sp.situacao)) params.set('situacao', sp.situacao)
  if (sp.pagina) params.set('pagina', sp.pagina)

  const [dados, cargos, unidades] = await Promise.all([
    apiGet<Paginado>(`/servidores?${params.toString()}`).catch(
      () => ({ itens: [], total: 0, pagina: 1, totalPaginas: 1 }) as Paginado,
    ),
    apiGet<Opcao[]>('/cargos').catch(() => []),
    apiGet<Opcao[]>('/unidades').catch(() => []),
  ])

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secundaria">Servidores</h1>
        <span className="text-sm opacity-60">{dados.total} no total</span>
      </div>

      <form className="flex flex-wrap gap-2" action="/servidores" method="get">
        <input name="busca" defaultValue={sp.busca} placeholder="Nome, CPF ou matrícula" className="w-64 rounded border px-3 py-2 text-sm" />
        <select name="situacao" defaultValue={sp.situacao ?? ''} className="rounded border px-3 py-2 text-sm">
          <option value="">Todas as situações</option>
          {SITUACOES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="rounded border px-4 py-2 text-sm">Filtrar</button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">CPF</th>
              <th className="px-3 py-2">Matrícula</th>
              <th className="px-3 py-2">Vínculo</th>
              <th className="px-3 py-2">Situação</th>
            </tr>
          </thead>
          <tbody>
            {dados.itens.map((s) => (
              <tr key={s.id} className="border-t hover:bg-black/5">
                <td className="px-3 py-2">
                  <Link href={`/servidores/${s.id}`} className="text-primaria hover:underline">{s.nome}</Link>
                </td>
                <td className="px-3 py-2 font-mono">{s.cpf}</td>
                <td className="px-3 py-2">{s.matricula ?? '—'}</td>
                <td className="px-3 py-2">{s.tipoVinculo}</td>
                <td className="px-3 py-2">{s.situacao}</td>
              </tr>
            ))}
            {dados.itens.length === 0 && (
              <tr><td className="px-3 py-3 opacity-60" colSpan={5}>Nenhum servidor encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <FormToast acao={criarServidor} sucesso="Servidor admitido" carregando="Admitindo…" className="max-w-xl space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Admitir servidor</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="nome" placeholder="Nome completo" required className="rounded border px-3 py-2 text-sm" />
          <input name="cpf" placeholder="CPF" required className="rounded border px-3 py-2 text-sm" />
          <input name="matricula" placeholder="Matrícula (efetivo/comissionado)" className="rounded border px-3 py-2 text-sm" />
          <input name="dataAdmissao" type="date" required className="rounded border px-3 py-2 text-sm" />
          <select name="tipoVinculo" defaultValue="" required className="rounded border px-3 py-2 text-sm">
            <option value="" disabled>Vínculo…</option>
            {VINCULOS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select name="regimeJuridico" defaultValue="" required className="rounded border px-3 py-2 text-sm">
            <option value="" disabled>Regime…</option>
            {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select name="cargoId" defaultValue="" required className="rounded border px-3 py-2 text-sm">
            <option value="" disabled>Cargo…</option>
            {cargos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select name="unidadeLotacaoId" defaultValue="" required className="rounded border px-3 py-2 text-sm">
            <option value="" disabled>Lotação…</option>
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.sigla ?? u.nome}</option>)}
          </select>
          <input name="classe" placeholder="Classe (opcional)" className="rounded border px-3 py-2 text-sm" />
          <input name="referencia" placeholder="Referência (opcional)" className="rounded border px-3 py-2 text-sm" />
          <input name="cargaHoraria" type="number" placeholder="Carga horária (opcional)" className="rounded border px-3 py-2 text-sm" />
        </div>
        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Admitir</button>
      </FormToast>
    </section>
  )
}
