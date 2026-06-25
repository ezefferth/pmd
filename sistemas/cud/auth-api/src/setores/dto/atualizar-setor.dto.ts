import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator'

export class AtualizarSetorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string

  @IsOptional()
  @IsString()
  sigla?: string

  @IsOptional()
  @IsString()
  paiId?: string

  @IsOptional()
  @IsBoolean()
  ativo?: boolean
}
