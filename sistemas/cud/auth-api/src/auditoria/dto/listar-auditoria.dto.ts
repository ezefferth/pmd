import { Type } from 'class-transformer'
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'
import { AcaoAuditoria } from '@prisma/client'

export class ListarAuditoriaDto {
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
  atorId?: string

  @IsOptional()
  @IsEnum(AcaoAuditoria)
  acao?: AcaoAuditoria

  @IsOptional()
  @IsString()
  entidade?: string

  @IsOptional()
  @IsISO8601()
  de?: string

  @IsOptional()
  @IsISO8601()
  ate?: string
}
