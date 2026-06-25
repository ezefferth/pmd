import type { TemaMunicipio } from '../tema'

// Tema da Prefeitura Municipal de Dourados/MS — manual de identidade visual.
//
// ⚠️ CONFIRMAR no manual: dois valores informados estão malformados (5 dígitos, hex inválido):
//   - "#d1d1b"  → falta 1 dígito (ex.: #d1d11b?) — NÃO assumido aqui
//   - "#1e1ec"  → falta 1 dígito (ex.: #1e1e1e?) — NÃO assumido aqui
// `texto` está provisório com um neutro escuro até a confirmação.
//
// ⚠️ Tipografia GOTHAM é licenciada (paga). É preciso fornecer os arquivos da fonte sob licença
// e registrá-los via @font-face nos apps. O fallback abaixo serve só para desenvolvimento.

export const temaDourados: TemaMunicipio = {
  slug: 'dourados',
  nome: 'Prefeitura Municipal de Dourados',
  cores: {
    primaria: '#2581c4', // azul
    secundaria: '#303474', // azul escuro
    destaque: '#fbe100', // amarelo
    info: '#0bbbef', // ciano
    texto: '#1e1e1e', // PROVISÓRIO — confirmar (original informado: "#1e1ec")
    fundo: '#ffffff',
    paleta: {
      azul: '#2581c4',
      azulEscuro: '#303474',
      amarelo: '#fbe100',
      ciano: '#0bbbef',
      // 'tokenA': '#d1d1b',  // CONFIRMAR — hex inválido no manual informado
      // 'tokenB': '#1e1ec',  // CONFIRMAR — hex inválido no manual informado
    },
  },
  tipografia: {
    titulo: '"Gotham Black", "Montserrat", system-ui, sans-serif',
    corpo: '"Gotham Medium", "Montserrat", system-ui, sans-serif',
  },
}

export default temaDourados
