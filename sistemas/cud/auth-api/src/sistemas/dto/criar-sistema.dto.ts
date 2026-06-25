import { IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class CriarSistemaDto {
  @IsString()
  @MinLength(2)
  nome!: string

  // slug imutável após criação (RN-CUD-010) — kebab-case
  @IsString()
  @Matches(/^[a-z][a-z0-9-]*$/, {
    message: 'slug deve ser kebab-case (minúsculas, números e hífen)',
  })
  slug!: string

  @IsOptional()
  @IsString()
  urlBase?: string

  @IsOptional()
  @IsString()
  descricao?: string
}
