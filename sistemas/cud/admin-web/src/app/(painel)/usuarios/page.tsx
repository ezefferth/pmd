import { apiGet } from '@/lib/api'

interface UsuarioResumo {
  id: string
  nome: string
  cpf: string
  email: string
  status: string
  tipoVinculo: string
  ativo: boolean
}

interface ResultadoPaginado {
  itens: UsuarioResumo[]
  total: number
  pagina: number
  totalPaginas: number
}

export default async function UsuariosPage() {
  let dados: ResultadoPaginado | null = null
  let erro = false
  try {
    dados = await apiGet<ResultadoPaginado>('/usuarios?limite=20')
  } catch {
    erro = true
  }

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold text-secundaria">Usuários</h1>

      {erro && (
        <p className="text-sm text-red-600">
          Não foi possível carregar (a auth-api está rodando? você é admin?).
        </p>
      )}

      {dados && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Vínculo</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {dados.itens.map((usuario) => (
                <tr key={usuario.id} className="border-t">
                  <td className="px-3 py-2">{usuario.nome}</td>
                  <td className="px-3 py-2">{usuario.email}</td>
                  <td className="px-3 py-2">{usuario.tipoVinculo}</td>
                  <td className="px-3 py-2">{usuario.status}</td>
                </tr>
              ))}
              {dados.itens.length === 0 && (
                <tr>
                  <td className="px-3 py-4 opacity-60" colSpan={4}>
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
