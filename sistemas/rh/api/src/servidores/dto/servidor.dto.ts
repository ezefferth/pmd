import { Type } from 'class-transformer'
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import {
  RegimeJuridico,
  SituacaoFuncional,
  TipoVinculoFuncional,
} from '@prisma/client'

export class CriarServidorDto {
  @IsString()
  cpf!: string

  @IsString()
  @MinLength(3)
  nome!: string

  @IsOptional()
  @IsString()
  matricula?: string

  @IsEnum(TipoVinculoFuncional)
  tipoVinculo!: TipoVinculoFuncional

  @IsEnum(RegimeJuridico)
  regimeJuridico!: RegimeJuridico

  @IsString()
  cargoId!: string

  @IsString()
  unidadeLotacaoId!: string

  @IsOptional()
  @IsString()
  classe?: string

  @IsOptional()
  @IsString()
  referencia?: string

  @IsISO8601()
  dataAdmissao!: string

  @IsOptional()
  @IsInt()
  @Min(1)
  cargaHoraria?: number
}

export class AtualizarSituacaoDto {
  @IsEnum(SituacaoFuncional)
  situacao!: SituacaoFuncional
}

export class ListarServidoresDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 20

  @IsOptional()
  @IsString()
  busca?: string

  @IsOptional()
  @IsEnum(SituacaoFuncional)
  situacao?: SituacaoFuncional
}
