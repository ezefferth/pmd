import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator'

export class CriarCarreiraDto {
  @IsString()
  @MinLength(2)
  nome!: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsOptional()
  @IsString()
  leiReferencia?: string
}

export class AtualizarCarreiraDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsOptional()
  @IsString()
  leiReferencia?: string
}

export class CriarFaixaDto {
  @IsString()
  classe!: string

  @IsString()
  referencia!: string

  @IsNumber()
  vencimentoBase!: number
}
