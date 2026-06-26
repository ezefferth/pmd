import Link from 'next/link'
import { apiGet } from '@/lib/api'
import { FormToast } from '@/components/form-toast'
import { criarCargo } from '@/actions/cargos'

const TIPOS = ['EFETIVO', 'COMISSAO', 'FUNCAO_GRATIFICADA', 'ESTAGIO', 'TEMPORARIO', 'ELETIVO']

interface Cargo {
  id: string
  nome: string
  tipo: string
  simbolo: string | null
  quantidadeVagas: number | null
  carreira: { id: string; nome: string } | null
}
interface Carreira {
  id: string
  nome: string
}

export default async function CargosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const { tipo } = await searchParams
  const filtro = tipo && TIPOS.includes(tipo) ? tipo : undefined

  const [cargos, carreiras] = await Promise.all([
    apiGet<Cargo[]>(`/cargos${filtro ? `?tipo=${filtro}` : ''}`).catch(() => []),
    apiGet<Carreira[]>('/carreiras').catch(() => []),
  ])

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Cargos</h1>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/cargos" className={`rounded border px-3 py-1 ${!filtro ? 'bg-primaria text-white' : 'hover:bg-black/5'}`}>Todos</Link>
        {TIPOS.map((t) => (
          <Link key={t} href={`/cargos?tipo=${t}`} className={`rounded border px-3 py-1 ${filtro === t ? 'bg-primaria text-white' : 'hover:bg-black/5'}`}>{t}</Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Cargo</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Símbolo</th>
              <th className="px-3 py-2">Vagas</th>
              <th className="px-3 py-2">Carreira</th>
            </tr>
          </thead>
          <tbody>
            {cargos.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.nome}</td>
                <td className="px-3 py-2">{c.tipo}</td>
                <td className="px-3 py-2">{c.simbolo ?? '—'}</td>
                <td className="px-3 py-2">{c.quantidadeVagas ?? '—'}</td>
                <td className="px-3 py-2">{c.carreira?.nome ?? '—'}</td>
              </tr>
            ))}
            {cargos.length === 0 && (
              <tr><td className="px-3 py-3 opacity-60" colSpan={5}>Nenhum cargo.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <FormToast acao={criarCargo} sucesso="Cargo criado" className="max-w-md space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Novo cargo</h2>
        <input name="nome" placeholder="Nome" required className="w-full rounded border px-3 py-2 text-sm" />
        <select name="tipo" defaultValue="" required className="w-full rounded border px-3 py-2 text-sm">
          <option value="" disabled>Tipo…</option>
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="carreiraId" defaultValue="" className="w-full rounded border px-3 py-2 text-sm">
          <option value="">Sem carreira (comissão/função)</option>
          {carreiras.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input name="simbolo" placeholder="Símbolo (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
          <input name="cargaHorariaSemanal" type="number" placeholder="Carga horária" className="w-full rounded border px-3 py-2 text-sm" />
          <input name="quantidadeVagas" type="number" placeholder="Vagas" className="w-full rounded border px-3 py-2 text-sm" />
          <input name="escolaridadeExigida" placeholder="Escolaridade" className="w-full rounded border px-3 py-2 text-sm" />
        </div>
        <input name="leiCriacao" placeholder="Lei de criação (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Criar</button>
      </FormToast>
    </section>
  )
}
