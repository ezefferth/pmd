'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { abrirProcesso } from '@/actions/processos'

export interface CampoPortal {
  id: string
  rotulo: string
  tipo: string
  placeholder: string | null
  obrigatorio: boolean
}
export interface AssuntoPortal {
  id: string
  nome: string
  secretariaId: string
  secretariaNome: string
  campos: CampoPortal[]
}

const inputCls = 'mt-1 w-full rounded border px-3 py-2 text-sm'

export function AbrirForm({
  assuntos,
  cpfInicial,
  nomeInicial,
}: {
  assuntos: AssuntoPortal[]
  cpfInicial: string
  nomeInicial: string
}) {
  const router = useRouter()
  const secretarias = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const a of assuntos) mapa.set(a.secretariaId, a.secretariaNome)
    return [...mapa.entries()]
  }, [assuntos])

  const [secretariaId, setSecretariaId] = useState('')
  const [assuntoId, setAssuntoId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [cpf, setCpf] = useState(cpfInicial)
  const [nome, setNome] = useState(nomeInicial)
  const [enviando, setEnviando] = useState(false)

  const assuntosFiltrados = assuntos.filter((a) => a.secretariaId === secretariaId)
  const assuntoSel = assuntos.find((a) => a.id === assuntoId)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!assuntoSel) {
      toast.error('Selecione o assunto')
      return
    }
    setEnviando(true)
    const promessa = abrirProcesso({ assuntoId, motivo, cpf, nome, campos })
    toast.promise(promessa, {
      loading: 'Abrindo processo…',
      success: (r) => `Processo aberto: ${r.numeroProtocolo}`,
      error: (e) => (e instanceof Error ? e.message : 'Falha ao abrir'),
    })
    try {
      await promessa
      router.push('/portal/meus-processos')
      router.refresh()
    } catch {
      // erro já exibido pelo toast
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4 rounded-lg border p-5">
      <label className="block text-sm">
        Secretaria
        <select
          value={secretariaId}
          onChange={(e) => {
            setSecretariaId(e.target.value)
            setAssuntoId('')
            setCampos({})
          }}
          required
          className={inputCls}
        >
          <option value="">Selecione…</option>
          {secretarias.map(([id, nomeSec]) => (
            <option key={id} value={id}>{nomeSec}</option>
          ))}
        </select>
      </label>

      {secretariaId && (
        <label className="block text-sm">
          Assunto
          <select
            value={assuntoId}
            onChange={(e) => {
              setAssuntoId(e.target.value)
              setCampos({})
            }}
            required
            className={inputCls}
          >
            <option value="">Selecione…</option>
            {assuntosFiltrados.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </label>
      )}

      {assuntoSel && (
        <>
          <label className="block text-sm">
            Motivo da solicitação
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              rows={3}
              className={inputCls}
            />
          </label>

          {assuntoSel.campos.map((campo) => (
            <label key={campo.id} className="block text-sm">
              {campo.rotulo} {campo.obrigatorio && <span className="text-red-600">*</span>}
              {campo.tipo === 'TEXTO_LONGO' ? (
                <textarea
                  value={campos[campo.id] ?? ''}
                  onChange={(e) => setCampos((c) => ({ ...c, [campo.id]: e.target.value }))}
                  placeholder={campo.placeholder ?? ''}
                  required={campo.obrigatorio}
                  rows={2}
                  className={inputCls}
                />
              ) : (
                <input
                  type={campo.tipo === 'NUMERO' ? 'number' : campo.tipo === 'DATA' ? 'date' : 'text'}
                  value={campos[campo.id] ?? ''}
                  onChange={(e) => setCampos((c) => ({ ...c, [campo.id]: e.target.value }))}
                  placeholder={campo.placeholder ?? ''}
                  required={campo.obrigatorio}
                  className={inputCls}
                />
              )}
            </label>
          ))}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Seu nome
              <input value={nome} onChange={(e) => setNome(e.target.value)} required className={inputCls} />
            </label>
            <label className="block text-sm">
              Seu CPF
              <input value={cpf} onChange={(e) => setCpf(e.target.value)} required className={inputCls} />
            </label>
          </div>

          <button
            disabled={enviando}
            className="rounded bg-primaria px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {enviando ? 'Abrindo…' : 'Abrir processo'}
          </button>
        </>
      )}
    </form>
  )
}
