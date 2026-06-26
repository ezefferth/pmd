'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function criarUsuario(formData: FormData) {
  await apiSend('POST', '/usuarios', {
    nome: String(formData.get('nome') ?? ''),
    email: String(formData.get('email') ?? ''),
    cpf: String(formData.get('cpf') ?? ''),
    tipoVinculo: String(formData.get('tipoVinculo') ?? 'EXTERNO'),
    matricula: (formData.get('matricula') as string) || undefined,
    telefone: (formData.get('telefone') as string) || undefined,
  })
  // navegação para /usuarios fica a cargo do FormToast (toast antes de redirecionar)
  revalidatePath('/usuarios')
}

export async function alterarStatusUsuario(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await apiSend('PATCH', `/usuarios/${id}/status`, {
    status: String(formData.get('status') ?? ''),
  })
  revalidatePath(`/usuarios/${id}`)
}

export async function alterarVinculoUsuario(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await apiSend('PATCH', `/usuarios/${id}/vinculo`, {
    tipoVinculo: String(formData.get('tipoVinculo') ?? ''),
    matricula: (formData.get('matricula') as string) || undefined,
  })
  revalidatePath(`/usuarios/${id}`)
}
