import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'
import { TipoCargo } from '@prisma/client'

export class CriarCargoDto {
  @IsString()
  @MinLength(2)
  nome!: string

  @IsEnum(TipoCargo)
  tipo!: TipoCargo

  @IsOptional()
  @IsString()
  carreiraId?: string

  @IsOptional()
  @IsString()
  simbolo?: string

  @IsOptional()
  @IsString()
  escolaridadeExigida?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  cargaHorariaSemanal?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  quantidadeVagas?: number

  @IsOptional()
  @IsString()
  leiCriacao?: string
}

export class AtualizarCargoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string

  @IsOptional()
  @IsString()
  simbolo?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  quantidadeVagas?: number
}
