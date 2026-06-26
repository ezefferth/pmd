import { prisma } from '@/lib/prisma'
import { obterUsuarioAtual } from '@/lib/sessao'

const rotuloStatus: Record<string, string> = {
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

export default async function MeusProcessosPage() {
  const usuario = await obterUsuarioAtual()
  const cpf = usuario?.cpf?.replace(/\D/g, '')

  const processos = cpf
    ? await prisma.processo.findMany({
        where: { requerente: { cpfCnpj: cpf } },
        include: { assunto: { select: { nome: true } } },
        orderBy: { criadoEm: 'desc' },
      })
    : []

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-secundaria">Meus processos</h1>

      {!cpf && (
        <p className="text-sm opacity-70">
          Não foi possível identificar seu CPF. Atualize seu cadastro na Central de Usuários.
        </p>
      )}

      {cpf && processos.length === 0 && (
        <p className="text-sm opacity-70">Você ainda não abriu processos.</p>
      )}

      {processos.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-3 py-2">Protocolo</th>
                <th className="px-3 py-2">Assunto</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Abertura</th>
              </tr>
            </thead>
            <tbody>
              {processos.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{p.numeroProtocolo}</td>
                  <td className="px-3 py-2">{p.assunto.nome}</td>
                  <td className="px-3 py-2">{rotuloStatus[p.status] ?? p.status}</td>
                  <td className="px-3 py-2">
                    {new Date(p.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
