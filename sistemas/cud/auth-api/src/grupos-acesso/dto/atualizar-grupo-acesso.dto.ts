import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class AtualizarGrupoAcessoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsOptional()
  @IsBoolean()
  ativo?: boolean

  // quando presente, substitui o conjunto de perfis do grupo
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perfilIds?: string[]
}
