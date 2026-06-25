import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator'

// slug não é alterável (RN-CUD-010)
export class AtualizarSistemaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string

  @IsOptional()
  @IsString()
  urlBase?: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsOptional()
  @IsBoolean()
  ativo?: boolean
}
