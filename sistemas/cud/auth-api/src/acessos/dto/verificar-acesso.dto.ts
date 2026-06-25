import { IsString } from 'class-validator'

export class VerificarAcessoDto {
  // authId (sub do JWT do Supabase) do usuário
  @IsString()
  usuarioId!: string

  // slug ou id do sistema
  @IsString()
  sistemaId!: string

  // permissão "MODULO:ACAO"
  @IsString()
  permissao!: string
}
