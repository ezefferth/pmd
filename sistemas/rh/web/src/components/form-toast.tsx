'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Form que envolve uma server action com feedback de toast (loading/sucesso/erro).
 * No sucesso, reseta o formulário e atualiza a rota — ou navega para `redirecionar`.
 */
export function FormToast({
  acao,
  sucesso,
  carregando = 'Salvando…',
  redirecionar,
  resetar = true,
  className,
  children,
}: {
  acao: (formData: FormData) => Promise<void>
  sucesso: string
  carregando?: string
  redirecionar?: string
  resetar?: boolean
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const ref = useRef<HTMLFormElement>(null)

  async function aoEnviar(formData: FormData) {
    await toast.promise(
      acao(formData).then(() => {
        if (redirecionar) {
          router.push(redirecionar)
        } else {
          if (resetar) ref.current?.reset()
          router.refresh()
        }
      }),
      {
        loading: carregando,
        success: sucesso,
        error: (e) => (e instanceof Error ? e.message : 'Falha ao salvar'),
      },
    )
  }

  return (
    <form ref={ref} action={aoEnviar} className={className}>
      {children}
    </form>
  )
}
