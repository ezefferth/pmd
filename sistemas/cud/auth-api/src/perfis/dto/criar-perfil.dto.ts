import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'

export class CriarPerfilDto {
  @IsString()
  sistemaId!: string

  @IsString()
  @MinLength(2)
  nome!: string

  @IsString()
  @Matches(/^[a-z][a-z0-9-]*$/, { message: 'slug deve ser kebab-case' })
  slug!: string

  @IsOptional()
  @IsString()
  descricao?: string

  // strings "MODULO:ACAO" (pt-BR) ou "*"
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissoes!: string[]

  @IsOptional()
  @IsBoolean()
  ehAdministrativo?: boolean

  @IsOptional()
  @IsBoolean()
  permiteExterno?: boolean
}
