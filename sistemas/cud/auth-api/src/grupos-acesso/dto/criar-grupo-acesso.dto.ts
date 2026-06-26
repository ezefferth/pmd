import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'

export class CriarGrupoAcessoDto {
  @IsString()
  @MinLength(2)
  nome!: string

  @IsString()
  @Matches(/^[a-z][a-z0-9-]*$/, { message: 'slug deve ser kebab-case' })
  slug!: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  perfilIds!: string[]
}
