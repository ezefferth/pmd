import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

// Dados que o próprio usuário pode alterar (e-mail principal é fluxo à parte)
export class AtualizarPerfilProprioDto {
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
