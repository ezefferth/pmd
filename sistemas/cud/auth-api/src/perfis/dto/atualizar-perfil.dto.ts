import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

// sistemaId e slug não mudam após criação
export class AtualizarPerfilDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissoes?: string[]

  @IsOptional()
  @IsBoolean()
  ehAdministrativo?: boolean

  @IsOptional()
  @IsBoolean()
  permiteExterno?: boolean

  @IsOptional()
  @IsBoolean()
  ativo?: boolean
}
