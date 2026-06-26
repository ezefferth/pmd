'use server'

import { revalidatePath } from 'next/cache'
import { TipoMovimentacao, TipoPessoa } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { gerarNumeroProtocolo } from '@/lib/protocolo'

export interface AberturaProcesso {
  assuntoId: string
  motivo: string
  cpf: string
  nome: string
  campos: Record<string, string>
}

export async function abrirProcesso(
  dados: AberturaProcesso,
): Promise<{ numeroProtocolo: string }> {
  const assunto = await prisma.assunto.findUnique({
    where: { id: dados.assuntoId },
    include: { camposAdicionais: true },
  })
  if (!assunto) throw new Error('Assunto não encontrado')
  if (!assunto.disponivelParaNovasAberturas || !assunto.permiteAberturaExterna) {
    throw new Error('Assunto indisponível para abertura externa')
  }

  // RN-081/085: campos adicionais obrigatórios
  for (const campo of assunto.camposAdicionais) {
    if (campo.obrigatorio && !dados.campos?.[campo.id]?.trim()) {
      throw new Error(`Preencha o campo obrigatório: ${campo.rotulo}`)
    }
  }

  const cpf = dados.cpf.replace(/\D/g, '')
  if (cpf.length !== 11) throw new Error('CPF inválido')

  const requerente = await prisma.parteInteressada.upsert({
    where: { cpfCnpj: cpf },
    create: { cpfCnpj: cpf, nome: dados.nome, tipoPessoa: TipoPessoa.PF },
    update: { nome: dados.nome },
  })

  const ano = new Date().getFullYear()
  // RN-017: direciona ao destino do assunto (ou à secretaria, se não houver)
  const organogramaAtualId = assunto.organogramaDestinoId ?? assunto.secretariaId

  const processo = await prisma.$transaction(async (tx) => {
    const { numeroProtocolo, numeroSequencial } = await gerarNumeroProtocolo(tx, ano)
    const criado = await tx.processo.create({
      data: {
        numeroProtocolo,
        numeroSequencial,
        ano,
        assuntoId: assunto.id,
        requerenteId: requerente.id,
        motivo: dados.motivo,
        organogramaAtualId,
        organogramaDestinoId: assunto.organogramaDestinoId,
      },
    })
    await tx.movimentacaoProcesso.create({
      data: {
        processoId: criado.id,
        tipo: TipoMovimentacao.CRIADO,
        observacao: dados.motivo,
      },
    })
    for (const campo of assunto.camposAdicionais) {
      const valor = dados.campos?.[campo.id]
      if (valor?.trim()) {
        await tx.processoCampoAdicional.create({
          data: { processoId: criado.id, campoAdicionalId: campo.id, valor },
        })
      }
    }
    return criado
  })

  revalidatePath('/portal/meus-processos')
  return { numeroProtocolo: processo.numeroProtocolo }
}
