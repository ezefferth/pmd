import type { Metadata } from 'next'
import './globals.css'
import { gerarVariaveisCss, obterTema } from '@/lib/tema'

export const metadata: Metadata = {
  title: 'Minha Conta — CUD',
  description: 'Conta do cidadão/servidor — Central de Usuários de Dourados',
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
        <style dangerouslySetInnerHTML={{ __html: gerarVariaveisCss(tema) }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
