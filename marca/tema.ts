// Marca / identidade visual — multi-município.
// Cada município tem seu próprio tema (cores + tipografia). Os apps web selecionam o tema
// pelo município ativo (env NEXT_PUBLIC_MUNICIPIO) e geram variáveis CSS a partir dele.
//
// Escalabilidade: a suíte roda para Dourados hoje, mas cada município é um deployment próprio
// (banco próprio). Só a camada de marca muda — basta adicionar um arquivo em `municipios/`.

export interface CoresMunicipio {
  /** Cor principal da marca (ações primárias, cabeçalhos) */
  primaria: string
  /** Cor de apoio (elementos secundários) */
  secundaria: string
  /** Cor de destaque (botões de ênfase, avisos positivos) */
  destaque: string
  /** Cor informativa (links, badges) */
  info: string
  /** Cor de texto padrão */
  texto: string
  /** Cor de fundo padrão */
  fundo: string
  /** Paleta bruta da marca (todos os tokens do manual, por nome) */
  paleta: Record<string, string>
}

export interface TipografiaMunicipio {
  /** Família para títulos/realce (ex.: Gotham Black) */
  titulo: string
  /** Família para corpo de texto (ex.: Gotham Medium) */
  corpo: string
}

export interface TemaMunicipio {
  /** Identificador do município (ex.: "dourados") */
  slug: string
  /** Nome de exibição (ex.: "Prefeitura Municipal de Dourados") */
  nome: string
  cores: CoresMunicipio
  tipografia: TipografiaMunicipio
}

/**
 * Gera as variáveis CSS (`--cor-*`, `--fonte-*`) a partir de um tema.
 * Os apps injetam o retorno em `:root` (ex.: num <style> no layout) e o Tailwind/CSS
 * consome as variáveis — assim a troca de município não exige rebuild de componentes.
 */
export function gerarVariaveisCss(tema: TemaMunicipio): string {
  const { cores, tipografia } = tema
  const linhas = [
    `--cor-primaria: ${cores.primaria};`,
    `--cor-secundaria: ${cores.secundaria};`,
    `--cor-destaque: ${cores.destaque};`,
    `--cor-info: ${cores.info};`,
    `--cor-texto: ${cores.texto};`,
    `--cor-fundo: ${cores.fundo};`,
    `--fonte-titulo: ${tipografia.titulo};`,
    `--fonte-corpo: ${tipografia.corpo};`,
  ]
  return `:root {\n  ${linhas.join('\n  ')}\n}`
}
