import { apiGet } from '@/lib/api'
import { SairButton } from '@/components/sair-button'
import { atualizarPerfil, alterarSenha, alterarEmail } from '@/actions/perfil'
import { FormToast } from '@/components/form-toast'

interface Perfil {
  nome: string
  cpf: string
  email: string
  emailSecundario: string | null
  telefone: string | null
  telefoneSecundario: string | null
  tipoVinculo: string
  status: string
  setor?: { nome: string } | null
}

export default async function MinhaContaPage() {
  let perfil: Perfil | null = null
  try {
    perfil = await apiGet<Perfil>('/perfil')
  } catch {
    perfil = null
  }

  if (!perfil) {
    return (
      <main className="p-6 text-sm text-red-600">
        Não foi possível carregar seu perfil (a auth-api está rodando?).
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secundaria">Minha Conta</h1>
        <SairButton />
      </header>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="opacity-60">Nome</dt>
        <dd>{perfil.nome}</dd>
        <dt className="opacity-60">CPF</dt>
        <dd>{perfil.cpf}</dd>
        <dt className="opacity-60">Vínculo</dt>
        <dd>{perfil.tipoVinculo}</dd>
        <dt className="opacity-60">Setor</dt>
        <dd>{perfil.setor?.nome ?? '—'}</dd>
      </dl>

      <FormToast acao={atualizarPerfil} sucesso="Dados atualizados" resetar={false} className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Dados de contato</h2>
        <label className="block text-sm">Nome
          <input name="nome" defaultValue={perfil.nome} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">Telefone
          <input name="telefone" defaultValue={perfil.telefone ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">Telefone secundário
          <input name="telefoneSecundario" defaultValue={perfil.telefoneSecundario ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">E-mail secundário
          <input name="emailSecundario" type="email" defaultValue={perfil.emailSecundario ?? ''} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">Salvar</button>
      </FormToast>

      <FormToast acao={alterarEmail} sucesso="E-mail alterado — verifique a caixa de entrada" className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">E-mail principal</h2>
        <p className="text-sm opacity-70">Atual: {perfil.email}. Alterar exige nova verificação.</p>
        <input name="email" type="email" placeholder="Novo e-mail" required className="w-full rounded border px-3 py-2 text-sm" />
        <button className="rounded border px-4 py-2 text-sm font-medium">Alterar e-mail</button>
      </FormToast>

      <FormToast acao={alterarSenha} sucesso="Senha alterada" className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Senha</h2>
        <input name="senha" type="password" placeholder="Nova senha (mín. 8)" required minLength={8} className="w-full rounded border px-3 py-2 text-sm" />
        <button className="rounded border px-4 py-2 text-sm font-medium">Alterar senha</button>
      </FormToast>
    </main>
  )
}
