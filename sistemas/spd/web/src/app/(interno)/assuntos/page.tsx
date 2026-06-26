import { prisma } from '@/lib/prisma'
import { FormToast } from '@/components/form-toast'
import { criarAssunto } from '@/actions/assuntos'

export default async function AssuntosPage() {
  const [assuntos, secretarias] = await Promise.all([
    prisma.assunto.findMany({ orderBy: [{ secretariaId: 'asc' }, { codigo: 'asc' }] }),
    prisma.organograma.findMany({ orderBy: { codigo: 'asc' } }),
  ])

  const nomeSecretaria = (id: string) =>
    secretarias.find((s) => s.id === id)?.sigla ??
    secretarias.find((s) => s.id === id)?.codigo ??
    '—'

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold text-secundaria">Assuntos</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Secretaria</th>
              <th className="px-3 py-2">Externo?</th>
            </tr>
          </thead>
          <tbody>
            {assuntos.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2 font-mono">{a.codigo}</td>
                <td className="px-3 py-2">{a.nome}</td>
                <td className="px-3 py-2">{nomeSecretaria(a.secretariaId)}</td>
                <td className="px-3 py-2">{a.permiteAberturaExterna ? 'sim' : 'não'}</td>
              </tr>
            ))}
            {assuntos.length === 0 && (
              <tr>
                <td className="px-3 py-3 opacity-60" colSpan={4}>Nenhum assunto.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormToast acao={criarAssunto} sucesso="Assunto criado" className="max-w-md space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Novo assunto</h2>
        <select name="secretariaId" required className="w-full rounded border px-3 py-2 text-sm">
          <option value="">Secretaria…</option>
          {secretarias.map((s) => (
            <option key={s.id} value={s.id}>{s.codigo} {s.sigla ?? ''}</option>
          ))}
        </select>
        <input name="nome" placeholder="Nome do assunto" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="prazoLegalDias" type="number" min={1} placeholder="Prazo legal (dias, opcional)" className="w-full rounded border px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="permiteAberturaExterna" defaultChecked /> Abertura externa (cidadão)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="permiteAberturaInterna" defaultChecked /> Abertura interna (servidor)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="permiteSigiloso" /> Permite sigiloso
        </label>
        <p className="text-xs opacity-60">O código é gerado automaticamente por secretaria (RN-016).</p>
        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Criar assunto</button>
      </FormToast>
    </section>
  )
}
