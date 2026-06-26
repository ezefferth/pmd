'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function criarCarreira(formData: FormData) {
  await apiSend('POST', '/carreiras', {
    nome: String(formData.get('nome') ?? ''),
    descricao: (formData.get('descricao') as string) || undefined,
    leiReferencia: (formData.get('leiReferencia') as string) || undefined,
  })
  revalidatePath('/carreiras')
}

export async function adicionarFaixa(formData: FormData) {
  const carreiraId = String(formData.get('carreiraId') ?? '')
  await apiSend('POST', `/carreiras/${carreiraId}/faixas`, {
    classe: String(formData.get('classe') ?? ''),
    referencia: String(formData.get('referencia') ?? ''),
    vencimentoBase: Number(formData.get('vencimentoBase') ?? 0),
  })
  revalidatePath('/carreiras')
}
