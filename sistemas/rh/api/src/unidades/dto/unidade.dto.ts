import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { TipoUnidade } from '@prisma/client'

export class CriarUnidadeDto {
  @IsString()
  @MinLength(2)
  nome!: string

  @IsOptional()
  @IsString()
  sigla?: string

  @IsEnum(TipoUnidade)
  tipo!: TipoUnidade

  @IsOptional()
  @IsString()
  paiId?: string
}

export class AtualizarUnidadeDto {
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
