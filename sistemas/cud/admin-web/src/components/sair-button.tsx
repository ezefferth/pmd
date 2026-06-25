'use client'

import { useRouter } from 'next/navigation'

export function SairButton() {
  const router = useRouter()

  async function sair() {
    await fetch('/api/sessao', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={sair}
      className="rounded border px-3 py-1 text-sm hover:bg-black/5"
    >
      Sair
    </button>
  )
}
