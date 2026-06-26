'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function criarNivel(formData: FormData) {
  await prisma.nivelOrganograma.create({
    data: {
      nivel: Number(formData.get('nivel')),
      nome: String(formData.get('nome') ?? ''),
    },
  })
  revalidatePath('/organograma')
}

export async function criarUnidade(formData: FormData) {
  const paiId = (formData.get('paiId') as string) || null
  await prisma.organograma.create({
    data: {
      codigo: String(formData.get('codigo') ?? ''),
      sigla: (formData.get('sigla') as string) || null,
      nivelId: String(formData.get('nivelId') ?? ''),
      paiId,
    },
  })
  revalidatePath('/organograma')
}
