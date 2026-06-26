export interface ResultadoPaginado<T> {
  itens: T[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

export function montarPaginado<T>(
  itens: T[],
  total: number,
  pagina: number,
  limite: number,
): ResultadoPaginado<T> {
  return {
    itens,
    total,
    pagina,
    limite,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  }
}
