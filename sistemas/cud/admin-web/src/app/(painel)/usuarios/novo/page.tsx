import Link from 'next/link'
import { criarUsuario } from '@/actions/usuarios'

const VINCULOS = [
  'EXTERNO',
  'EFETIVO',
  'COMISSIONADO',
  'ESTAGIARIO',
  'ELETIVO',
  'TEMPORARIO',
]

export default function NovoUsuarioPage() {
  return (
    <section className="max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secundaria">Novo usuário</h1>
        <Link href="/usuarios" className="text-sm underline">
          voltar
        </Link>
      </div>

      <form action={criarUsuario} className="space-y-3 rounded-lg border p-4">
        <input name="nome" placeholder="Nome" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="E-mail" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="cpf" placeholder="CPF" required className="w-full rounded border px-3 py-2 text-sm" />
        <input name="telefone" placeholder="Telefone (opcional)" className="w-full rounded border px-3 py-2 text-sm" />
        <select name="tipoVinculo" defaultValue="EXTERNO" className="w-full rounded border px-3 py-2 text-sm">
          {VINCULOS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <input name="matricula" placeholder="Matrícula (só efetivo/comissionado)" className="w-full rounded border px-3 py-2 text-sm" />
        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">
          Criar
        </button>
      </form>
    </section>
  )
}
