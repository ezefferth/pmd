import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primaria: 'var(--cor-primaria)',
        secundaria: 'var(--cor-secundaria)',
        destaque: 'var(--cor-destaque)',
        info: 'var(--cor-info)',
      },
      fontFamily: {
        titulo: 'var(--fonte-titulo)',
        corpo: 'var(--fonte-corpo)',
      },
    },
  },
  plugins: [],
}

export default config
