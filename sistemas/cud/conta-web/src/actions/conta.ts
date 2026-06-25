'use server'

import { redirect } from 'next/navigation'
import { apiSend } from '@/lib/api'

export async function cadastrar(formData: FormData) {
  await apiSend('POST', '/usuarios/auto-registro', {
    nome: String(formData.get('nome') ?? ''),
    email: String(formData.get('email') ?? ''),
    cpf: String(formData.get('cpf') ?? ''),
    senha: String(formData.get('senha') ?? ''),
  })
  redirect('/login?cadastro=ok')
}

export async function recuperarSenha(formData: FormData) {
  await apiSend('POST', '/autenticacao/recuperar-senha', {
    email: String(formData.get('email') ?? ''),
  })
  redirect('/login?recuperar=ok')
}
