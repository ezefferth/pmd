import { apiGet } from '@/lib/api'
import { FormToast } from '@/components/form-toast'
import { criarUnidade, desativarUnidade } from '@/actions/unidades'

const TIPOS = ['SECRETARIA', 'DEPARTAMENTO', 'COORDENADORIA', 'SETOR']

interface Unidade {
  id: string
  nome: string
  sigla: string | null
  tipo: string
  paiId: string | null
  ativo: boolean
}

function ordenarArvore(unidades: Unidade[]): { unidade: Unidade; nivel: number }[] {
  const porPai = new Map<string | null, Unidade[]>()
  for (const u of unidades) {
    const lista = porPai.get(u.paiId) ?? []
    lista.push(u)
    porPai.set(u.paiId, lista)
  }
  const saida: { unidade: Unidade; nivel: number }[] = []
  const visitar = (paiId: string | null, nivel: number) => {
    for (const u of porPai.get(paiId) ?? []) {
      saida.push({ unidade: u, nivel })
      visitar(u.id, nivel + 1)
    }
  }
  visitar(null, 0)
  // inclui órfãos (pai inexistente) na raiz para não sumirem
  const incluidos = new Set(saida.map((s) => s.unidade.id))
  for (const u of unidades) {
    if (!incluidos.has(u.id)) saida.push({ unidade: u, nivel: 0 })
  }
  return saida
}

export default async function UnidadesPage() {
  const unidades = await apiGet<Unidade[]>('/unidades').catch(() => [])
  const arvore = ordenarArvore(unidades)

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Unidades organizacionais</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Unidade</th>
              <th className="px-3 py-2">Sigla</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Ativa</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {arvore.map(({ unidade, nivel }) => (
              <tr key={unidade.id} className="border-t">
                <td className="px-3 py-2" style={{ paddingLeft: `${nivel * 1.25 + 0.75}rem` }}>
                  {nivel > 0 && <span className="opacity-40">└ </span>}
                  {unidade.nome}
                </td>
                <td className="px-3 py-2">{unidade.sigla ?? '—'}</td>
                <td className="px-3 py-2">{unidade.tipo}</td>
                <td className="px-3 py-2">{unidade.ativo ? 'sim' : 'não'}</td>
                <td className="px-3 py-2 text-right">
                  {unidade.ativo && (
                    <FormToast acao={desativarUnidade} sucesso="Unidade desativada" carregando="Desativando…" resetar={false}>
                      <input type="hidden" name="id" value={unidade.id} />
                      <button className="rounded border px-2 py-1 text-xs">Desativar</button>
                    </FormToast>
                  )}
                </td>
              </tr>
            ))}
            {arvore.length === 0 && (
              <tr><td className="px-3 py-3 opacity-60" colSpan={5}>Nenhuma unidade cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <FormToast acao={criarUnidade} sucesso="Unidade criada" className="max-w-md space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Nova unidade</h2>
        <input name="nome" placeholder="Nome" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="sigla" placeholder="Sigla (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
        <select name="tipo" defaultValue="" required className="w-full rounded border px-3 py-2 text-sm">
          <option value="" disabled>Tipo…</option>
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="paiId" defaultValue="" className="w-full rounded border px-3 py-2 text-sm">
          <option value="">Sem unidade pai (raiz)</option>
          {unidades.map((u) => <option key={u.id} value={u.id}>{u.sigla ?? u.nome}</option>)}
        </select>
        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Criar</button>
      </FormToast>
    </section>
  )
}
