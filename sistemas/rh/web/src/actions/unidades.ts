'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function criarUnidade(formData: FormData) {
  await apiSend('POST', '/unidades', {
    nome: String(formData.get('nome') ?? ''),
    sigla: (formData.get('sigla') as string) || undefined,
    tipo: String(formData.get('tipo') ?? ''),
    paiId: (formData.get('paiId') as string) || undefined,
  })
  revalidatePath('/unidades')
}

export async function desativarUnidade(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await apiSend('DELETE', `/unidades/${id}`)
  revalidatePath('/unidades')
}
