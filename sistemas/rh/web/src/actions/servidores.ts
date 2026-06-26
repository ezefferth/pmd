'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function criarServidor(formData: FormData) {
  const cargaHoraria = formData.get('cargaHoraria')
  await apiSend('POST', '/servidores', {
    cpf: String(formData.get('cpf') ?? ''),
    nome: String(formData.get('nome') ?? ''),
    matricula: (formData.get('matricula') as string) || undefined,
    tipoVinculo: String(formData.get('tipoVinculo') ?? ''),
    regimeJuridico: String(formData.get('regimeJuridico') ?? ''),
    cargoId: String(formData.get('cargoId') ?? ''),
    unidadeLotacaoId: String(formData.get('unidadeLotacaoId') ?? ''),
    classe: (formData.get('classe') as string) || undefined,
    referencia: (formData.get('referencia') as string) || undefined,
    dataAdmissao: String(formData.get('dataAdmissao') ?? ''),
    cargaHoraria: cargaHoraria ? Number(cargaHoraria) : undefined,
  })
  revalidatePath('/servidores')
}

export async function alterarSituacaoServidor(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  await apiSend('PATCH', `/servidores/${id}/situacao`, {
    situacao: String(formData.get('situacao') ?? ''),
  })
  revalidatePath(`/servidores/${id}`)
}
