import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Encapsula o acesso ao Supabase Auth (GoTrue).
 * - `admin`: service role — operações administrativas (criar/atualizar usuários).
 * - `publico`: anon key — login e fluxos públicos.
 */
@Injectable()
export class SupabaseService {
  private readonly clienteAdmin: SupabaseClient
  private readonly clientePublico: SupabaseClient

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL')
    const semSessao = { auth: { autoRefreshToken: false, persistSession: false } }

    this.clienteAdmin = createClient(
      url,
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      semSessao,
    )
    this.clientePublico = createClient(
      url,
      this.config.getOrThrow<string>('SUPABASE_ANON_KEY'),
      semSessao,
    )
  }

  get admin(): SupabaseClient {
    return this.clienteAdmin
  }

  /** Cria o usuário no GoTrue (RN-CUD-003: existe no Auth antes do banco). */
  async criarUsuarioAuth(params: {
    email: string
    senha?: string
    metadata?: Record<string, unknown>
    emailConfirmado?: boolean
  }) {
    return this.clienteAdmin.auth.admin.createUser({
      email: params.email,
      password: params.senha,
      email_confirm: params.emailConfirmado ?? false,
      user_metadata: params.metadata,
    })
  }

  /** Remove o usuário do GoTrue — rollback quando a gravação no banco falha (RN-CUD-003). */
  async excluirUsuarioAuth(authId: string) {
    return this.clienteAdmin.auth.admin.deleteUser(authId)
  }

  async autenticar(email: string, senha: string) {
    return this.clientePublico.auth.signInWithPassword({ email, password: senha })
  }

  async enviarRecuperacaoSenha(email: string) {
    return this.clientePublico.auth.resetPasswordForEmail(email)
  }
}
