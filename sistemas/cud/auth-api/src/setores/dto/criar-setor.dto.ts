import { IsOptional, IsString, MinLength } from 'class-validator'

export class CriarSetorDto {
  @IsString()
  @MinLength(2)
  nome!: string

  @IsOptional()
  @IsString()
  sigla?: string

  @IsOptional()
  @IsString()
  paiId?: string

  // id do setor no RH (quando sincronizado)
  @IsOptional()
  @IsString()
  rhId?: string
}
