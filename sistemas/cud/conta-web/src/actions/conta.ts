'use server'

import { apiSend } from '@/lib/api'

export async function cadastrar(formData: FormData) {
  await apiSend('POST', '/usuarios/auto-registro', {
    nome: String(formData.get('nome') ?? ''),
    email: String(formData.get('email') ?? ''),
    cpf: String(formData.get('cpf') ?? ''),
    senha: String(formData.get('senha') ?? ''),
  })
  // navegação para /login fica a cargo do FormToast (toast antes de redirecionar)
}

export async function recuperarSenha(formData: FormData) {
  await apiSend('POST', '/autenticacao/recuperar-senha', {
    email: String(formData.get('email') ?? ''),
  })
}
