'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function criarAssunto(formData: FormData) {
  const secretariaId = String(formData.get('secretariaId') ?? '')

  // RN-016: próximo código sequencial por secretaria
  const ultimo = await prisma.assunto.findFirst({
    where: { secretariaId },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  })
  const codigo = (ultimo?.codigo ?? 0) + 1

  await prisma.assunto.create({
    data: {
      codigo,
      secretariaId,
      nome: String(formData.get('nome') ?? ''),
      permiteAberturaExterna: formData.get('permiteAberturaExterna') === 'on',
      permiteAberturaInterna: formData.get('permiteAberturaInterna') === 'on',
      permiteSigiloso: formData.get('permiteSigiloso') === 'on',
      prazoLegalDias: formData.get('prazoLegalDias')
        ? Number(formData.get('prazoLegalDias'))
        : null,
    },
  })
  revalidatePath('/assuntos')
}
