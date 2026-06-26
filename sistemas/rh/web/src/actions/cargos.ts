'use server'

import { revalidatePath } from 'next/cache'
import { apiSend } from '@/lib/api'

export async function criarCargo(formData: FormData) {
  const cargaHoraria = formData.get('cargaHorariaSemanal')
  const vagas = formData.get('quantidadeVagas')
  await apiSend('POST', '/cargos', {
    nome: String(formData.get('nome') ?? ''),
    tipo: String(formData.get('tipo') ?? ''),
    carreiraId: (formData.get('carreiraId') as string) || undefined,
    simbolo: (formData.get('simbolo') as string) || undefined,
    escolaridadeExigida: (formData.get('escolaridadeExigida') as string) || undefined,
    cargaHorariaSemanal: cargaHoraria ? Number(cargaHoraria) : undefined,
    quantidadeVagas: vagas ? Number(vagas) : undefined,
    leiCriacao: (formData.get('leiCriacao') as string) || undefined,
  })
  revalidatePath('/cargos')
}
