'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { concederAcesso } from '@/actions/acessos'

export interface OpcaoUsuario {
  id: string
  nome: string
  email: string
}
export interface OpcaoSistema {
  id: string
  nome: string
}
export interface OpcaoPerfil {
  id: string
  nome: string
  sistemaId: string
}

const campo = 'mt-1 w-full rounded border px-3 py-2 text-sm'

export function ConcederForm({
  usuarios,
  sistemas,
  perfis,
}: {
  usuarios: OpcaoUsuario[]
  sistemas: OpcaoSistema[]
  perfis: OpcaoPerfil[]
}) {
  const router = useRouter()
  const [usuarioId, setUsuarioId] = useState('')
  const [sistemaId, setSistemaId] = useState('')
  const [perfilId, setPerfilId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  const perfisDoSistema = useMemo(
    () => perfis.filter((p) => p.sistemaId === sistemaId),
    [perfis, sistemaId],
  )

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!usuarioId || !sistemaId || !perfilId) {
      toast.error('Selecione usuário, sistema e perfil')
      return
    }
    const dados = new FormData()
    dados.set('usuarioId', usuarioId)
    dados.set('sistemaId', sistemaId)
    dados.set('perfilId', perfilId)
    if (motivo) dados.set('motivo', motivo)

    setEnviando(true)
    const promessa = concederAcesso(dados)
    toast.promise(promessa, {
      loading: 'Concedendo…',
      success: 'Acesso concedido',
      error: (e) => (e instanceof Error ? e.message : 'Falha ao conceder'),
    })
    try {
      await promessa
      setPerfilId('')
      setMotivo('')
      router.refresh()
    } catch {
      // erro já exibido no toast
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">Conceder acesso</h2>

      <label className="block text-sm">
        Usuário
        <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} required className={campo}>
          <option value="">Selecione…</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nome} — {u.email}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        Sistema
        <select
          value={sistemaId}
          onChange={(e) => {
            setSistemaId(e.target.value)
            setPerfilId('')
          }}
          required
          className={campo}
        >
          <option value="">Selecione…</option>
          {sistemas.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </label>

      {sistemaId && (
        <label className="block text-sm">
          Perfil
          <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)} required className={campo}>
            <option value="">Selecione…</option>
            {perfisDoSistema.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          {perfisDoSistema.length === 0 && (
            <span className="text-xs opacity-60">Nenhum perfil neste sistema.</span>
          )}
        </label>
      )}

      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo (opcional)"
        className="w-full rounded border px-3 py-2 text-sm"
      />

      <button disabled={enviando} className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {enviando ? 'Concedendo…' : 'Conceder'}
      </button>
    </form>
  )
}
