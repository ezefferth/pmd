import { apiGet } from '@/lib/api'
import { FormToast } from '@/components/form-toast'
import {
  criarGrupoAcesso,
  excluirGrupoAcesso,
  aplicarGrupoAcesso,
} from '@/actions/grupos-acesso'

interface Sistema {
  id: string
  nome: string
}
interface Perfil {
  id: string
  nome: string
  slug: string
}
interface GrupoAcesso {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ativo: boolean
  perfis: { perfil: { id: string; nome: string; sistema: { nome: string } } }[]
}
interface UsuarioResumo {
  id: string
  nome: string
  email: string
}
interface ResultadoPaginado {
  itens: UsuarioResumo[]
}

export default async function GruposAcessoPage() {
  const [grupos, sistemas, paginado] = await Promise.all([
    apiGet<GrupoAcesso[]>('/grupos-acesso').catch(() => []),
    apiGet<Sistema[]>('/sistemas').catch(() => []),
    apiGet<ResultadoPaginado>('/usuarios?limite=100').catch(() => ({ itens: [] })),
  ])
  const usuarios = paginado.itens

  // perfis de cada sistema, para montar a seleção agrupada
  const perfisPorSistema = await Promise.all(
    sistemas.map(async (s) => ({
      sistema: s,
      perfis: await apiGet<Perfil[]>(`/perfis?sistemaId=${s.id}`).catch(() => []),
    })),
  )
  const temPerfis = perfisPorSistema.some((g) => g.perfis.length > 0)

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secundaria">Grupos de acesso</h1>
        <p className="text-sm opacity-70">
          Pacotes de perfis aplicáveis a um usuário de uma vez (no máximo um perfil por sistema).
        </p>
      </div>

      {/* lista de grupos */}
      <div className="space-y-4">
        {grupos.length === 0 && (
          <p className="text-sm opacity-70">Nenhum grupo cadastrado.</p>
        )}
        {grupos.map((g) => (
          <div key={g.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {g.nome}{' '}
                  <span className="font-mono text-xs opacity-50">{g.slug}</span>
                  {!g.ativo && (
                    <span className="ml-2 rounded bg-black/10 px-2 py-0.5 text-xs">inativo</span>
                  )}
                </div>
                {g.descricao && <p className="text-sm opacity-70">{g.descricao}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {g.perfis.map((p) => (
                    <span key={p.perfil.id} className="rounded border px-2 py-0.5 text-xs">
                      {p.perfil.sistema.nome}: {p.perfil.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-end gap-2">
                <FormToast
                  acao={aplicarGrupoAcesso}
                  sucesso="Grupo aplicado ao usuário"
                  carregando="Aplicando…"
                  className="flex items-end gap-2"
                >
                  <input type="hidden" name="id" value={g.id} />
                  <label className="text-xs">
                    Aplicar a
                    <select
                      name="usuarioId"
                      defaultValue=""
                      required
                      className="mt-1 w-64 rounded border px-2 py-1 text-sm"
                    >
                      <option value="" disabled>Selecione um usuário…</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>{u.nome} — {u.email}</option>
                      ))}
                    </select>
                  </label>
                  <button className="rounded bg-primaria px-3 py-1.5 text-sm font-medium text-white">
                    Aplicar
                  </button>
                </FormToast>

                <FormToast
                  acao={excluirGrupoAcesso}
                  sucesso="Grupo excluído"
                  carregando="Excluindo…"
                  resetar={false}
                >
                  <input type="hidden" name="id" value={g.id} />
                  <button className="rounded border px-3 py-1.5 text-sm">Excluir</button>
                </FormToast>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* novo grupo */}
      <FormToast
        acao={criarGrupoAcesso}
        sucesso="Grupo criado"
        className="max-w-2xl space-y-3 rounded-lg border p-4"
      >
        <h2 className="font-semibold">Novo grupo</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="nome" placeholder="Nome" required className="w-full rounded border px-3 py-2 text-sm" />
          <input name="slug" placeholder="slug (ex.: atendente-protocolo)" required className="w-full rounded border px-3 py-2 text-sm" />
        </div>
        <input name="descricao" placeholder="Descrição (opcional)" className="w-full rounded border px-3 py-2 text-sm" />

        <div>
          <p className="mb-2 text-sm font-medium">Perfis do grupo</p>
          {!temPerfis && (
            <p className="text-sm opacity-60">
              Cadastre sistemas e perfis antes de montar um grupo.
            </p>
          )}
          <div className="space-y-3">
            {perfisPorSistema
              .filter((g) => g.perfis.length > 0)
              .map((g) => (
                <fieldset key={g.sistema.id} className="rounded border p-3">
                  <legend className="px-1 text-xs font-semibold opacity-70">
                    {g.sistema.nome}
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {g.perfis.map((p) => (
                      <label key={p.id} className="flex items-center gap-1 text-sm">
                        <input type="checkbox" name="perfilIds" value={p.id} />
                        {p.nome}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
          </div>
        </div>

        <button className="rounded bg-primaria px-4 py-2 text-sm font-medium text-white">
          Criar grupo
        </button>
      </FormToast>
    </section>
  )
}
