'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function criarPerfil(formData: FormData) {
  const permissoes = String(formData.get('permissoes') ?? '')
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean)

  await apiSend('POST', '/perfis', {
    sistemaId: String(formData.get('sistemaId') ?? ''),
    nome: String(formData.get('nome') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    permissoes,
    permiteExterno: formData.get('permiteExterno') === 'on',
  })
  revalidatePath('/perfis')
}
