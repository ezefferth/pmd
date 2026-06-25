import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'
import { TipoVinculo } from '@prisma/client'

export class CriarUsuarioDto {
  @IsString()
  @MinLength(3)
  nome!: string

  @IsEmail()
  email!: string

  @IsString()
  cpf!: string

  @IsOptional()
  @IsString()
  matricula?: string

  @IsOptional()
  @IsString()
  telefone?: string

  @IsOptional()
  @IsEnum(TipoVinculo)
  tipoVinculo?: TipoVinculo

  @IsOptional()
  @IsBoolean()
  ehAdminGlobal?: boolean
}
