import Link from 'next/link'
import { StatusProcesso } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const ROTULO_STATUS: Record<StatusProcesso, string> = {
  ABERTO: 'Aberto',
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em análise',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_DOCUMENTOS: 'Aguardando documentos',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  TRANSFERIDO: 'Transferido',
  CONCLUIDO: 'Concluído',
  ARQUIVADO: 'Arquivado',
  CANCELADO: 'Cancelado',
}

function ehStatus(valor: string | undefined): valor is StatusProcesso {
  return !!valor && valor in ROTULO_STATUS
}

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filtro = ehStatus(status) ? status : undefined

  const processos = await prisma.processo.findMany({
    where: filtro ? { status: filtro } : undefined,
    include: {
      assunto: { select: { nome: true } },
      organogramaAtual: { select: { sigla: true, codigo: true } },
      usuarioAtribuido: { select: { nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
    take: 200,
  })

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-secundaria">Processos</h1>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/processos"
          className={`rounded border px-3 py-1 ${!filtro ? 'bg-primaria text-white' : 'hover:bg-black/5'}`}
        >
          Todos
        </Link>
        {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
          <Link
            key={valor}
            href={`/processos?status=${valor}`}
            className={`rounded border px-3 py-1 ${filtro === valor ? 'bg-primaria text-white' : 'hover:bg-black/5'}`}
          >
            {rotulo}
          </Link>
        ))}
      </div>

      {processos.length === 0 ? (
        <p className="text-sm opacity-70">Nenhum processo encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-3 py-2">Protocolo</th>
                <th className="px-3 py-2">Assunto</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Setor atual</th>
                <th className="px-3 py-2">Atribuído</th>
              </tr>
            </thead>
            <tbody>
              {processos.map((p) => (
                <tr key={p.id} className="border-t hover:bg-black/5">
                  <td className="px-3 py-2 font-mono">
                    <Link href={`/processos/${p.id}`} className="text-primaria hover:underline">
                      {p.numeroProtocolo}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{p.assunto.nome}</td>
                  <td className="px-3 py-2">{ROTULO_STATUS[p.status]}</td>
                  <td className="px-3 py-2">
                    {p.organogramaAtual.sigla ?? p.organogramaAtual.codigo}
                  </td>
                  <td className="px-3 py-2">{p.usuarioAtribuido?.nome ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
