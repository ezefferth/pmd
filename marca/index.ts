import type { TemaMunicipio } from './tema'
import { temaDourados } from './municipios/dourados'

export * from './tema'

/** Registro de temas por município. Adicionar novos municípios aqui. */
export const temas: Record<string, TemaMunicipio> = {
  dourados: temaDourados,
}

/** Município padrão quando `NEXT_PUBLIC_MUNICIPIO` não estiver definido. */
export const MUNICIPIO_PADRAO = 'dourados'

/** Resolve o tema do município ativo (env ou padrão). */
export function obterTema(slug?: string): TemaMunicipio {
  const chave = slug ?? process.env.NEXT_PUBLIC_MUNICIPIO ?? MUNICIPIO_PADRAO
  return temas[chave] ?? temas[MUNICIPIO_PADRAO]
}
