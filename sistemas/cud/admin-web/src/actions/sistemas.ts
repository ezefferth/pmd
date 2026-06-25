'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function criarSistema(formData: FormData) {
  await apiSend('POST', '/sistemas', {
    nome: String(formData.get('nome') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    urlBase: (formData.get('urlBase') as string) || undefined,
    descricao: (formData.get('descricao') as string) || undefined,
  })
  revalidatePath('/sistemas')
}
