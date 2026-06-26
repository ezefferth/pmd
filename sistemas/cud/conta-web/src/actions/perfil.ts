'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function atualizarPerfil(formData: FormData) {
  await apiSend('PATCH', '/perfil', {
    nome: String(formData.get('nome') ?? ''),
    telefone: (formData.get('telefone') as string) || undefined,
    telefoneSecundario: (formData.get('telefoneSecundario') as string) || undefined,
    emailSecundario: (formData.get('emailSecundario') as string) || undefined,
  })
  revalidatePath('/')
}

export async function alterarSenha(formData: FormData) {
  await apiSend('POST', '/perfil/senha', {
    senha: String(formData.get('senha') ?? ''),
  })
  revalidatePath('/')
}

export async function alterarEmail(formData: FormData) {
  await apiSend('POST', '/perfil/email', {
    email: String(formData.get('email') ?? ''),
  })
  revalidatePath('/')
}
