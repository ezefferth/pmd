import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { SituacaoFuncional, TipoVinculo } from '@prisma/client'

export class SetorSyncDto {
  @IsString()
  rhId!: string

  @IsString()
  nome!: string

  @IsOptional()
  @IsString()
  sigla?: string

  @IsOptional()
  @IsString()
  paiRhId?: string
}

export class SincronizarSetoresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetorSyncDto)
  setores!: SetorSyncDto[]
}

export class ServidorSyncDto {
  @IsString()
  cpf!: string

  @IsOptional()
  @IsString()
  matricula?: string

  @IsOptional()
  @IsString()
  cargo?: string

  // RH envia um subconjunto de TipoVinculo (sem EXTERNO)
  @IsEnum(TipoVinculo)
  tipoVinculo!: TipoVinculo

  @IsEnum(SituacaoFuncional)
  situacaoFuncional!: SituacaoFuncional

  @IsOptional()
  @IsString()
  unidadeRhId?: string

  @IsOptional()
  @IsString()
  rhId?: string

  @IsOptional()
  @IsISO8601()
  dataAdmissao?: string

  @IsOptional()
  @IsISO8601()
  dataExoneracao?: string
}

export class SincronizarServidoresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServidorSyncDto)
  servidores!: ServidorSyncDto[]
}
