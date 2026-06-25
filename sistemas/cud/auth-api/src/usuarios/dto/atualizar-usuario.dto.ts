import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

// Alteração de e-mail principal é fluxo à parte (revalidação) — não entra aqui
export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nome?: string

  @IsOptional()
  @IsString()
  telefone?: string

  @IsOptional()
  @IsString()
  telefoneSecundario?: string

  @IsOptional()
  @IsEmail()
  emailSecundario?: string
}
