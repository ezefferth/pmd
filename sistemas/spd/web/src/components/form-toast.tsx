'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Form que envolve uma server action com feedback de toast (loading/sucesso/erro).
 * Reseta o formulário e atualiza a rota no sucesso.
 */
export function FormToast({
  acao,
  sucesso,
  className,
  children,
}: {
  acao: (formData: FormData) => Promise<void>
  sucesso: string
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const ref = useRef<HTMLFormElement>(null)

  async function aoEnviar(formData: FormData) {
    await toast.promise(
      acao(formData).then(() => {
        ref.current?.reset()
        router.refresh()
      }),
      {
        loading: 'Salvando…',
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
