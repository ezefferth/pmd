# marca/ — Identidade visual (multi-município)

Tokens de **cor e tipografia** da suíte PMD, organizados **por município**. A suíte roda para
Dourados hoje, mas escala para outros municípios: cada um é um deployment próprio (banco próprio) e
só a **camada de marca** muda — basta adicionar um arquivo em `municipios/`.

```
marca/
├── tema.ts              # tipos (TemaMunicipio) + gerarVariaveisCss()
├── index.ts            # registro de temas + obterTema()
└── municipios/
    └── dourados.ts     # tokens de Dourados
```

## Como os apps consomem
1. Selecionam o município ativo por env: `NEXT_PUBLIC_MUNICIPIO=dourados`.
2. `obterTema()` resolve o `TemaMunicipio`.
3. `gerarVariaveisCss(tema)` injeta `:root { --cor-primaria; --fonte-titulo; ... }` no layout.
4. Componentes e Tailwind consomem as variáveis CSS — trocar de município **não** exige rebuild de componentes.

```ts
import { obterTema, gerarVariaveisCss } from '@/marca' // ou caminho relativo
const tema = obterTema()
// <style dangerouslySetInnerHTML={{ __html: gerarVariaveisCss(tema) }} /> no RootLayout
```

No Tailwind, mapear para as variáveis:
```js
// tailwind.config — theme.extend.colors
colors: {
  primaria: 'var(--cor-primaria)',
  secundaria: 'var(--cor-secundaria)',
  destaque: 'var(--cor-destaque)',
  info: 'var(--cor-info)',
}
```

## Cores de Dourados
| Token        | Hex       | Observação                          |
|--------------|-----------|-------------------------------------|
| azul         | `#2581c4` | primária                            |
| azul escuro  | `#303474` | secundária                          |
| amarelo      | `#fbe100` | destaque                            |
| ciano        | `#0bbbef` | info                                |
| texto        | `#1e1e1e` | **provisório** — confirmar          |

> ⚠️ **Dois valores do manual vieram malformados** (5 dígitos): `#d1d1b` e `#1e1ec`.
> Não foram assumidos. Confirmar os hexes corretos no manual de identidade e completar `dourados.ts`.

## Tipografia
- Títulos/realce: **Gotham Black**
- Corpo: **Gotham Medium**

> ⚠️ **Gotham é licenciada (paga).** É preciso fornecer os arquivos da fonte sob licença e registrá-los
> via `@font-face`. O fallback (`Montserrat`/`system-ui`) serve apenas para desenvolvimento.
