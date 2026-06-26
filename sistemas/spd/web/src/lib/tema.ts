// Tema do município (cópia local de `marca/` da raiz). Gotham é licenciada (fallback p/ dev).
interface Tema {
  cores: {
    primaria: string
    secundaria: string
    destaque: string
    info: string
    texto: string
    fundo: string
  }
  tipografia: { titulo: string; corpo: string }
}

const temas: Record<string, Tema> = {
  dourados: {
    cores: {
      primaria: '#2581c4',
      secundaria: '#303474',
      destaque: '#fbe100',
      info: '#0bbbef',
      texto: '#1e1e1e',
      fundo: '#ffffff',
    },
    tipografia: {
      titulo: '"Gotham Black", "Montserrat", system-ui, sans-serif',
      corpo: '"Gotham Medium", "Montserrat", system-ui, sans-serif',
    },
  },
}

export function obterTema(): Tema {
  const slug = process.env.NEXT_PUBLIC_MUNICIPIO ?? 'dourados'
  return temas[slug] ?? temas.dourados
}

export function gerarVariaveisCss(tema: Tema): string {
  const { cores, tipografia } = tema
  return `:root{--cor-primaria:${cores.primaria};--cor-secundaria:${cores.secundaria};--cor-destaque:${cores.destaque};--cor-info:${cores.info};--cor-texto:${cores.texto};--cor-fundo:${cores.fundo};--fonte-titulo:${tipografia.titulo};--fonte-corpo:${tipografia.corpo};}`
}
