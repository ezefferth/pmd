import type { Metadata } from 'next'
import './globals.css'
import { gerarVariaveisCss, obterTema } from '@/lib/tema'

export const metadata: Metadata = {
  title: 'CUD — Gerenciador de Usuários',
  description: 'Central de Usuários de Dourados',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tema = obterTema()
  return (
    <html lang="pt-BR">
      <head>
        {/* injeta as variáveis de cor/tipografia do município ativo (marca) */}
        <style dangerouslySetInnerHTML={{ __html: gerarVariaveisCss(tema) }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
