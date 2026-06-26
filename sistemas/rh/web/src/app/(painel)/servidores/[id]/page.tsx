import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiGet } from '@/lib/api'
import { FormToast } from '@/components/form-toast'
import { alterarSituacaoServidor } from '@/actions/servidores'

const SITUACOES = ['ATIVO', 'FERIAS', 'AFASTADO', 'LICENCA', 'CEDIDO', 'VACANCIA', 'EXONERADO', 'APOSENTADO']

interface Servidor {
  id: string
  nome: string
  cpf: string
  matricula: string | null
  tipoVinculo: string
  regimeJuridico: string
  situacao: string
  dataAdmissao: string | null
  classe: string | null
  referencia: string | null
  cargo: { nome: string } | null
  unidadeLotacao: { nome: string; sigla: string | null } | null
}
interface Movimentacao {
  id: string
  tipo: string
  data: string
  observacao: string | null
}

function dataBR(valor: string | null): string {
  return valor ? new Date(valor).toLocaleDateString('pt-BR') : '—'
}

export default async function ServidorDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const servidor = await apiGet<Servidor>(`/servidores/${id}`).catch(() => null)
  if (!servidor) notFound()

  const movimentacoes = await apiGet<Movimentacao[]>(`/movimentacoes?servidorId=${id}`).catch(() => [])

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secundaria">{servidor.nome}</h1>
        <Link href="/servidores" className="text-sm underline">voltar</Link>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm md:max-w-xl">
        <dt className="opacity-60">CPF</dt><dd className="font-mono">{servidor.cpf}</dd>
        <dt className="opacity-60">Matrícula</dt><dd>{servidor.matricula ?? '—'}</dd>
        <dt className="opacity-60">Vínculo</dt><dd>{servidor.tipoVinculo}</dd>
        <dt className="opacity-60">Regime</dt><dd>{servidor.regimeJuridico}</dd>
        <dt className="opacity-60">Cargo</dt><dd>{servidor.cargo?.nome ?? '—'}</dd>
        <dt className="opacity-60">Lotação</dt><dd>{servidor.unidadeLotacao?.sigla ?? servidor.unidadeLotacao?.nome ?? '—'}</dd>
        <dt className="opacity-60">Classe/Referência</dt><dd>{[servidor.classe, servidor.referencia].filter(Boolean).join(' / ') || '—'}</dd>
        <dt className="opacity-60">Admissão</dt><dd>{dataBR(servidor.dataAdmissao)}</dd>
        <dt className="opacity-60">Situação</dt><dd className="font-medium">{servidor.situacao}</dd>
      </dl>

      <FormToast acao={alterarSituacaoServidor} sucesso="Situação atualizada" resetar={false} className="max-w-sm space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Alterar situação funcional</h2>
        <input type="hidden" name="id" value={servidor.id} />
        <select name="situacao" defaultValue={servidor.situacao} className="w-full rounded border px-3 py-2 text-sm">
          {SITUACOES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="rounded border px-4 py-2 text-sm font-medium">Salvar</button>
      </FormToast>

      <div>
        <h2 className="mb-3 font-semibold">Movimentações funcionais</h2>
        <ol className="space-y-2">
          {movimentacoes.map((m) => (
            <li key={m.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.tipo}</span>
                <span className="text-xs opacity-60">{dataBR(m.data)}</span>
              </div>
              {m.observacao && <p className="mt-1 opacity-80">{m.observacao}</p>}
            </li>
          ))}
          {movimentacoes.length === 0 && <p className="text-sm opacity-60">Sem movimentações.</p>}
        </ol>
      </div>
    </section>
  )
}
