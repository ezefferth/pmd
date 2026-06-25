'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function concederAcesso(formData: FormData) {
  await apiSend('POST', '/acessos', {
    usuarioId: String(formData.get('usuarioId') ?? ''),
    sistemaId: String(formData.get('sistemaId') ?? ''),
    perfilId: String(formData.get('perfilId') ?? ''),
    motivo: (formData.get('motivo') as string) || undefined,
  })
  revalidatePath('/acessos')
}

export async function revogarAcesso(formData: FormData) {
  await apiSend('POST', '/acessos/revogar', {
    usuarioId: String(formData.get('usuarioId') ?? ''),
    sistemaId: String(formData.get('sistemaId') ?? ''),
  })
  revalidatePath('/acessos')
}
