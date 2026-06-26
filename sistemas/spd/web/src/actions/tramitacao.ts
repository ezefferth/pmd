'use server'

import { revalidatePath } from 'next/cache'
import { Prisma, StatusProcesso, TipoMovimentacao } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { obterUsuarioAtual } from '@/lib/sessao'
import { resolverDestinoAtivo } from '@/lib/responsavel'

const STATUS_FINAIS: StatusProcesso[] = [
  StatusProcesso.CONCLUIDO,
  StatusProcesso.ARQUIVADO,
  StatusProcesso.CANCELADO,
]
const STATUS_RECEBIVEIS: StatusProcesso[] = [
  StatusProcesso.ABERTO,
  StatusProcesso.TRANSFERIDO,
]
const STATUS_REABRIVEIS: StatusProcesso[] = [
  StatusProcesso.CONCLUIDO,
  StatusProcesso.ARQUIVADO,
]

function exigirProcessoId(formData: FormData): string {
  const id = String(formData.get('processoId') ?? '')
  if (!id) throw new Error('Processo não informado')
  return id
}

async function carregarProcesso(tx: Prisma.TransactionClient, id: string) {
  const processo = await tx.processo.findUnique({ where: { id } })
  if (!processo) throw new Error('Processo não encontrado')
  return processo
}

function revalidar(id: string) {
  revalidatePath(`/processos/${id}`)
  revalidatePath('/processos')
}

/** ABERTO/TRANSFERIDO → RECEBIDO (RN-024) */
export async function receberProcesso(formData: FormData) {
  const id = exigirProcessoId(formData)
  const ator = await obterUsuarioAtual()

  await prisma.$transaction(async (tx) => {
    const processo = await carregarProcesso(tx, id)
    if (!STATUS_RECEBIVEIS.includes(processo.status)) {
      throw new Error('Só é possível receber processos abertos ou transferidos')
    }
    await tx.processo.update({
      where: { id },
      data: { status: StatusProcesso.RECEBIDO },
    })
    await tx.movimentacaoProcesso.create({
      data: { processoId: id, tipo: TipoMovimentacao.RECEBIDO, usuarioId: ator?.id ?? null },
    })
  })
  revalidar(id)
}

/** Atribui o processo a um servidor e o bloqueia individualmente (RN-027). */
export async function atribuirProcesso(formData: FormData) {
  const id = exigirProcessoId(formData)
  const usuarioAtribuidoId = String(formData.get('usuarioAtribuidoId') ?? '')
  if (!usuarioAtribuidoId) throw new Error('Informe o servidor responsável')
  const ator = await obterUsuarioAtual()

  await prisma.$transaction(async (tx) => {
    const processo = await carregarProcesso(tx, id)
    if (STATUS_FINAIS.includes(processo.status)) {
      throw new Error('Processo encerrado não pode ser atribuído')
    }
    const alvo = await tx.usuario.findUnique({
      where: { id: usuarioAtribuidoId },
      select: { ativo: true },
    })
    if (!alvo) throw new Error('Servidor não encontrado')
    // RN-088: não encaminhar a responsável inativo
    if (!alvo.ativo) throw new Error('Servidor inativo — escolha um responsável ativo')

    await tx.processo.update({
      where: { id },
      data: {
        usuarioAtribuidoId,
        estaBloqueado: true,
        status: StatusProcesso.EM_ANALISE,
      },
    })
    await tx.movimentacaoProcesso.create({
      data: {
        processoId: id,
        tipo: TipoMovimentacao.ANDAMENTO,
        usuarioId: ator?.id ?? null,
        observacao: 'Processo atribuído a servidor.',
      },
    })
  })
  revalidar(id)
}

/** Registra andamento/comentário (RECEBIDO/EM_ANALISE/EM_ANDAMENTO → EM_ANDAMENTO). */
export async function registrarAndamento(formData: FormData) {
  const id = exigirProcessoId(formData)
  const observacao = String(formData.get('observacao') ?? '').trim()
  if (!observacao) throw new Error('Descreva o andamento')
  const ator = await obterUsuarioAtual()

  await prisma.$transaction(async (tx) => {
    const processo = await carregarProcesso(tx, id)
    if (STATUS_FINAIS.includes(processo.status) || processo.status === StatusProcesso.ABERTO) {
      throw new Error('Receba o processo antes de dar andamento')
    }
    await tx.processo.update({
      where: { id },
      data: { status: StatusProcesso.EM_ANDAMENTO },
    })
    await tx.movimentacaoProcesso.create({
      data: {
        processoId: id,
        tipo: TipoMovimentacao.ANDAMENTO,
        usuarioId: ator?.id ?? null,
        observacao,
      },
    })
  })
  revalidar(id)
}

/** Transfere para outro setor; resolve responsável ativo no destino (RN-028/088). */
export async function transferirProcesso(formData: FormData) {
  const id = exigirProcessoId(formData)
  const organogramaDestinoId = String(formData.get('organogramaDestinoId') ?? '')
  const observacao = String(formData.get('observacao') ?? '').trim()
  if (!organogramaDestinoId) throw new Error('Selecione o setor de destino')
  const ator = await obterUsuarioAtual()

  await prisma.$transaction(async (tx) => {
    const processo = await carregarProcesso(tx, id)
    if (STATUS_FINAIS.includes(processo.status)) {
      throw new Error('Processo encerrado não pode ser transferido')
    }
    if (organogramaDestinoId === processo.organogramaAtualId) {
      throw new Error('O destino é o mesmo setor atual')
    }
    const destino = await tx.organograma.findUnique({
      where: { id: organogramaDestinoId },
      select: { ativo: true },
    })
    if (!destino?.ativo) throw new Error('Setor de destino inválido ou inativo')

    // RN-088: redireciona para um responsável ativo do destino
    const resolvido = await resolverDestinoAtivo(tx, organogramaDestinoId)
    const partes = [observacao, resolvido.motivoRedirecionamento].filter(Boolean)

    await tx.processo.update({
      where: { id },
      data: {
        organogramaOrigemId: processo.organogramaAtualId,
        organogramaAtualId: organogramaDestinoId,
        usuarioAtribuidoId: resolvido.usuarioAtribuidoId,
        estaBloqueado: Boolean(resolvido.usuarioAtribuidoId),
        status: StatusProcesso.RECEBIDO,
      },
    })
    await tx.movimentacaoProcesso.create({
      data: {
        processoId: id,
        tipo: TipoMovimentacao.TRANSFERENCIA,
        usuarioId: ator?.id ?? null,
        observacao: partes.join(' ') || null,
        organogramaOrigemId: processo.organogramaAtualId,
        organogramaDestinoId,
      },
    })
  })
  revalidar(id)
}

/** Conclui o processo com parecer conclusivo (RN-037). */
export async function concluirProcesso(formData: FormData) {
  const id = exigirProcessoId(formData)
  const textoParecer = String(formData.get('textoParecer') ?? '').trim()
  if (!textoParecer) throw new Error('Informe o parecer de conclusão')
  const ator = await obterUsuarioAtual()

  await prisma.$transaction(async (tx) => {
    const processo = await carregarProcesso(tx, id)
    if (STATUS_FINAIS.includes(processo.status)) {
      throw new Error('Processo já encerrado')
    }
    await tx.processo.update({
      where: { id },
      data: { status: StatusProcesso.CONCLUIDO, estaBloqueado: false },
    })
    await tx.movimentacaoProcesso.create({
      data: {
        processoId: id,
        tipo: TipoMovimentacao.CONCLUSAO,
        usuarioId: ator?.id ?? null,
        textoParecer,
        ehConclusivo: true,
      },
    })
  })
  revalidar(id)
}

/** CONCLUIDO → ARQUIVADO (RN-030). */
export async function arquivarProcesso(formData: FormData) {
  const id = exigirProcessoId(formData)
  const ator = await obterUsuarioAtual()

  await prisma.$transaction(async (tx) => {
    const processo = await carregarProcesso(tx, id)
    if (processo.status !== StatusProcesso.CONCLUIDO) {
      throw new Error('Só processos concluídos podem ser arquivados')
    }
    await tx.processo.update({
      where: { id },
      data: { status: StatusProcesso.ARQUIVADO },
    })
    await tx.movimentacaoProcesso.create({
      data: { processoId: id, tipo: TipoMovimentacao.ARQUIVAMENTO, usuarioId: ator?.id ?? null },
    })
  })
  revalidar(id)
}

/** CONCLUIDO/ARQUIVADO → RECEBIDO (RN-031). */
export async function reabrirProcesso(formData: FormData) {
  const id = exigirProcessoId(formData)
  const observacao = String(formData.get('observacao') ?? '').trim()
  const ator = await obterUsuarioAtual()

  await prisma.$transaction(async (tx) => {
    const processo = await carregarProcesso(tx, id)
    if (!STATUS_REABRIVEIS.includes(processo.status)) {
      throw new Error('Só processos concluídos ou arquivados podem ser reabertos')
    }
    await tx.processo.update({
      where: { id },
      data: { status: StatusProcesso.RECEBIDO },
    })
    await tx.movimentacaoProcesso.create({
      data: {
        processoId: id,
        tipo: TipoMovimentacao.REABERTURA,
        usuarioId: ator?.id ?? null,
        observacao: observacao || null,
      },
    })
  })
  revalidar(id)
}

/** Cancela o processo (RN-032). */
export async function cancelarProcesso(formData: FormData) {
  const id = exigirProcessoId(formData)
  const observacao = String(formData.get('observacao') ?? '').trim()
  if (!observacao) throw new Error('Justifique o cancelamento')
  const ator = await obterUsuarioAtual()

  await prisma.$transaction(async (tx) => {
    const processo = await carregarProcesso(tx, id)
    if (STATUS_FINAIS.includes(processo.status)) {
      throw new Error('Processo já encerrado')
    }
    await tx.processo.update({
      where: { id },
      data: { status: StatusProcesso.CANCELADO, estaBloqueado: false },
    })
    await tx.movimentacaoProcesso.create({
      data: {
        processoId: id,
        tipo: TipoMovimentacao.CANCELAMENTO,
        usuarioId: ator?.id ?? null,
        observacao,
      },
    })
  })
  revalidar(id)
}

/**
 * Realoca os processos pendentes de um servidor que ficou inativo (RN-087/089).
 * Para cada processo atribuído e não encerrado, aplica a estratégia do setor atual.
 */
export async function realocarProcessosDeResponsavel(formData: FormData) {
  const usuarioId = String(formData.get('usuarioId') ?? '')
  if (!usuarioId) throw new Error('Servidor não informado')
  const ator = await obterUsuarioAtual()

  const processos = await prisma.processo.findMany({
    where: { usuarioAtribuidoId: usuarioId, status: { notIn: STATUS_FINAIS } },
    select: { id: true, organogramaAtualId: true },
  })

  for (const processo of processos) {
    await prisma.$transaction(async (tx) => {
      const resolvido = await resolverDestinoAtivo(tx, processo.organogramaAtualId)
      await tx.processo.update({
        where: { id: processo.id },
        data: {
          usuarioAtribuidoId: resolvido.usuarioAtribuidoId,
          estaBloqueado: Boolean(resolvido.usuarioAtribuidoId),
        },
      })
      await tx.movimentacaoProcesso.create({
        data: {
          processoId: processo.id,
          tipo: TipoMovimentacao.DEVOLUCAO,
          usuarioId: ator?.id ?? null,
          observacao:
            resolvido.motivoRedirecionamento ??
            'Responsável inativo — processo realocado (RN-087).',
        },
      })
    })
  }

  revalidatePath('/processos')
  return { realocados: processos.length }
}
