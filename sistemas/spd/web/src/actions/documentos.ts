'use server'

import { revalidatePath } from 'next/cache'
import { TipoMovimentacao } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { obterUsuarioAtual } from '@/lib/sessao'
import { enviarDocumento } from '@/lib/storage'

const TAMANHO_MAXIMO_MB = 25

/** Anexa uma peça (documento) ao processo: upload no Storage + Documento + movimentação (RN-069). */
export async function anexarDocumento(formData: FormData) {
  const processoId = String(formData.get('processoId') ?? '')
  if (!processoId) throw new Error('Processo não informado')

  const arquivo = formData.get('arquivo')
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error('Selecione um arquivo')
  }
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    throw new Error(`Arquivo excede ${TAMANHO_MAXIMO_MB} MB`)
  }

  const processo = await prisma.processo.findUnique({
    where: { id: processoId },
    select: { id: true, estaBloqueado: true },
  })
  if (!processo) throw new Error('Processo não encontrado')

  const ator = await obterUsuarioAtual()
  const { caminho } = await enviarDocumento(processoId, arquivo)

  await prisma.$transaction(async (tx) => {
    // RN-069: numeroOrdem sequencial e contínuo por processo (não reaproveitado)
    const ultimo = await tx.documento.aggregate({
      where: { processoId },
      _max: { numeroOrdem: true },
    })
    const numeroOrdem = (ultimo._max.numeroOrdem ?? 0) + 1

    await tx.documento.create({
      data: { processoId, nome: arquivo.name, urlArquivo: caminho, numeroOrdem },
    })
    await tx.movimentacaoProcesso.create({
      data: {
        processoId,
        tipo: TipoMovimentacao.JUNTADA_DOCUMENTO,
        usuarioId: ator?.id ?? null,
        observacao: `Juntada de documento: ${arquivo.name} (peça ${numeroOrdem}).`,
      },
    })
  })

  revalidatePath(`/processos/${processoId}`)
}
