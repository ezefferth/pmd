import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StatusProcesso, TipoMovimentacao } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { urlAssinada } from '@/lib/storage'
import { FormToast } from '@/components/form-toast'
import {
  receberProcesso,
  atribuirProcesso,
  registrarAndamento,
  transferirProcesso,
  concluirProcesso,
  arquivarProcesso,
  reabrirProcesso,
  cancelarProcesso,
} from '@/actions/tramitacao'
import { anexarDocumento } from '@/actions/documentos'

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

const FINAIS: StatusProcesso[] = [
  StatusProcesso.CONCLUIDO,
  StatusProcesso.ARQUIVADO,
  StatusProcesso.CANCELADO,
]
const RECEBIVEIS: StatusProcesso[] = [
  StatusProcesso.ABERTO,
  StatusProcesso.TRANSFERIDO,
]

const campo = 'mt-1 w-full rounded border px-3 py-2 text-sm'

export default async function ProcessoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      assunto: { select: { nome: true } },
      requerente: { select: { nome: true, cpfCnpj: true } },
      organogramaAtual: { select: { sigla: true, codigo: true } },
      usuarioAtribuido: { select: { nome: true } },
      camposAdicionais: { include: { campoAdicional: { select: { rotulo: true } } } },
      movimentacoes: {
        orderBy: { criadoEm: 'desc' },
        include: { usuario: { select: { nome: true } } },
      },
      documentos: { orderBy: { numeroOrdem: 'asc' } },
    },
  })
  if (!processo) notFound()

  // URLs assinadas temporárias para baixar cada peça (bucket privado)
  const documentos = await Promise.all(
    processo.documentos.map(async (d) => ({
      ...d,
      url: await urlAssinada(d.urlArquivo).catch(() => null),
    })),
  )

  const [organogramas, servidores] = await Promise.all([
    prisma.organograma.findMany({
      where: { ativo: true },
      select: { id: true, sigla: true, codigo: true },
      orderBy: { codigo: 'asc' },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  const ehFinal = FINAIS.includes(processo.status)
  const podeReceber = RECEBIVEIS.includes(processo.status)
  const emTramite = !ehFinal && processo.status !== StatusProcesso.ABERTO

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-secundaria">
            {processo.numeroProtocolo}
          </h1>
          <p className="text-sm opacity-70">{processo.assunto.nome}</p>
        </div>
        <Link href="/processos" className="text-sm underline">
          voltar
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm md:max-w-xl">
        <dt className="opacity-60">Status</dt>
        <dd className="font-medium">{ROTULO_STATUS[processo.status]}</dd>
        <dt className="opacity-60">Setor atual</dt>
        <dd>{processo.organogramaAtual.sigla ?? processo.organogramaAtual.codigo}</dd>
        <dt className="opacity-60">Atribuído a</dt>
        <dd>{processo.usuarioAtribuido?.nome ?? '—'}</dd>
        <dt className="opacity-60">Requerente</dt>
        <dd>{processo.requerente?.nome ?? (processo.ehAnonimo ? 'Anônimo' : '—')}</dd>
        {processo.motivo && (
          <>
            <dt className="opacity-60">Motivo</dt>
            <dd>{processo.motivo}</dd>
          </>
        )}
        {processo.camposAdicionais.map((c) => (
          <div key={c.id} className="contents">
            <dt className="opacity-60">{c.campoAdicional.rotulo}</dt>
            <dd>{c.valor ?? '—'}</dd>
          </div>
        ))}
      </dl>

      {/* Ações de tramitação por status */}
      {!ehFinal && (
        <div className="grid gap-4 md:grid-cols-2">
          {podeReceber && (
            <FormToast acao={receberProcesso} sucesso="Processo recebido" carregando="Recebendo…" resetar={false} className="rounded-lg border p-4">
              <h2 className="mb-2 font-semibold">Receber</h2>
              <input type="hidden" name="processoId" value={processo.id} />
              <p className="mb-3 text-sm opacity-70">Confirmar o recebimento no setor atual.</p>
              <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Receber</button>
            </FormToast>
          )}

          {emTramite && (
            <>
              <FormToast acao={atribuirProcesso} sucesso="Processo atribuído" carregando="Atribuindo…" resetar={false} className="rounded-lg border p-4">
                <h2 className="mb-2 font-semibold">Atribuir a servidor</h2>
                <input type="hidden" name="processoId" value={processo.id} />
                <select name="usuarioAtribuidoId" required className={campo} defaultValue="">
                  <option value="" disabled>Selecione…</option>
                  {servidores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
                <button className="mt-3 rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Atribuir</button>
              </FormToast>

              <FormToast acao={registrarAndamento} sucesso="Andamento registrado" carregando="Registrando…" className="rounded-lg border p-4">
                <h2 className="mb-2 font-semibold">Registrar andamento</h2>
                <input type="hidden" name="processoId" value={processo.id} />
                <textarea name="observacao" required rows={3} placeholder="Descreva o andamento" className={campo} />
                <button className="mt-3 rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Registrar</button>
              </FormToast>

              <FormToast acao={transferirProcesso} sucesso="Processo transferido" carregando="Transferindo…" className="rounded-lg border p-4">
                <h2 className="mb-2 font-semibold">Transferir de setor</h2>
                <input type="hidden" name="processoId" value={processo.id} />
                <select name="organogramaDestinoId" required className={campo} defaultValue="">
                  <option value="" disabled>Setor de destino…</option>
                  {organogramas.map((o) => (
                    <option key={o.id} value={o.id}>{o.sigla ?? o.codigo}</option>
                  ))}
                </select>
                <textarea name="observacao" rows={2} placeholder="Observação (opcional)" className={campo} />
                <button className="mt-3 rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Transferir</button>
              </FormToast>

              <FormToast acao={concluirProcesso} sucesso="Processo concluído" carregando="Concluindo…" className="rounded-lg border p-4">
                <h2 className="mb-2 font-semibold">Concluir</h2>
                <input type="hidden" name="processoId" value={processo.id} />
                <textarea name="textoParecer" required rows={3} placeholder="Parecer de conclusão" className={campo} />
                <button className="mt-3 rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Concluir</button>
              </FormToast>

              <FormToast acao={cancelarProcesso} sucesso="Processo cancelado" carregando="Cancelando…" className="rounded-lg border p-4">
                <h2 className="mb-2 font-semibold">Cancelar</h2>
                <input type="hidden" name="processoId" value={processo.id} />
                <textarea name="observacao" required rows={2} placeholder="Justificativa do cancelamento" className={campo} />
                <button className="mt-3 rounded border px-4 py-2 text-sm font-medium">Cancelar processo</button>
              </FormToast>
            </>
          )}
        </div>
      )}

      {/* Ações de processo encerrado */}
      {(processo.status === StatusProcesso.CONCLUIDO ||
        processo.status === StatusProcesso.ARQUIVADO) && (
        <div className="grid gap-4 md:grid-cols-2">
          {processo.status === StatusProcesso.CONCLUIDO && (
            <FormToast acao={arquivarProcesso} sucesso="Processo arquivado" carregando="Arquivando…" resetar={false} className="rounded-lg border p-4">
              <h2 className="mb-2 font-semibold">Arquivar</h2>
              <input type="hidden" name="processoId" value={processo.id} />
              <button className="rounded border px-4 py-2 text-sm font-medium">Arquivar</button>
            </FormToast>
          )}
          <FormToast acao={reabrirProcesso} sucesso="Processo reaberto" carregando="Reabrindo…" className="rounded-lg border p-4">
            <h2 className="mb-2 font-semibold">Reabrir</h2>
            <input type="hidden" name="processoId" value={processo.id} />
            <textarea name="observacao" rows={2} placeholder="Motivo da reabertura (opcional)" className={campo} />
            <button className="mt-3 rounded border px-4 py-2 text-sm font-medium">Reabrir</button>
          </FormToast>
        </div>
      )}

      {/* Documentos (peças do processo) */}
      <div>
        <h2 className="mb-3 font-semibold">Documentos</h2>
        {documentos.length > 0 ? (
          <ul className="mb-4 divide-y rounded-lg border">
            {documentos.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  <span className="mr-2 font-mono text-xs opacity-50">
                    {String(d.numeroOrdem ?? 0).padStart(3, '0')}
                  </span>
                  {d.nome}
                </span>
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primaria hover:underline">
                    baixar
                  </a>
                ) : (
                  <span className="text-xs opacity-50">indisponível</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm opacity-60">Nenhuma peça anexada.</p>
        )}

        {!ehFinal && (
          <FormToast
            acao={anexarDocumento}
            sucesso="Documento anexado"
            carregando="Enviando…"
            className="flex flex-wrap items-center gap-2 rounded-lg border p-4"
          >
            <input type="hidden" name="processoId" value={processo.id} />
            <input
              type="file"
              name="arquivo"
              required
              className="text-sm file:mr-3 file:rounded file:border-0 file:bg-primaria file:px-3 file:py-1.5 file:text-white"
            />
            <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Anexar</button>
          </FormToast>
        )}
      </div>

      {/* Timeline de movimentações */}
      <div>
        <h2 className="mb-3 font-semibold">Movimentações</h2>
        <ol className="space-y-3">
          {processo.movimentacoes.map((m) => (
            <li key={m.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{rotuloMov(m.tipo)}</span>
                <span className="text-xs opacity-60">
                  {new Date(m.criadoEm).toLocaleString('pt-BR')}
                </span>
              </div>
              {(m.observacao || m.textoParecer) && (
                <p className="mt-1 opacity-80">{m.observacao ?? m.textoParecer}</p>
              )}
              <p className="mt-1 text-xs opacity-50">
                {m.usuario?.nome ?? 'Sistema'}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function rotuloMov(tipo: TipoMovimentacao): string {
  const mapa: Partial<Record<TipoMovimentacao, string>> = {
    CRIADO: 'Processo criado',
    RECEBIDO: 'Recebido',
    ANDAMENTO: 'Andamento',
    TRANSFERENCIA: 'Transferência',
    DEVOLUCAO: 'Devolução',
    CONCLUSAO: 'Conclusão',
    ARQUIVAMENTO: 'Arquivamento',
    REABERTURA: 'Reabertura',
    CANCELAMENTO: 'Cancelamento',
    COMENTARIO: 'Comentário',
    PARECER: 'Parecer',
    JUNTADA_DOCUMENTO: 'Juntada de documento',
  }
  return mapa[tipo] ?? tipo
}
