'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function criarGrupoAcesso(formData: FormData) {
  const perfilIds = formData.getAll('perfilIds').map(String).filter(Boolean)
  await apiSend('POST', '/grupos-acesso', {
    nome: String(formData.get('nome') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    descricao: (formData.get('descricao') as string) || undefined,
    perfilIds,
  })
  revalidatePath('/grupos-acesso')
}

export async function excluirGrupoAcesso(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await apiSend('DELETE', `/grupos-acesso/${id}`)
  revalidatePath('/grupos-acesso')
}

export async function aplicarGrupoAcesso(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await apiSend('POST', `/grupos-acesso/${id}/aplicar`, {
    usuarioId: String(formData.get('usuarioId') ?? ''),
  })
  revalidatePath('/grupos-acesso')
}
