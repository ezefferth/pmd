import { IsISO8601, IsOptional, IsString } from 'class-validator'

export class ConcederAcessoDto {
  @IsString()
  usuarioId!: string

  @IsString()
  sistemaId!: string

  @IsString()
  perfilId!: string

  @IsOptional()
  @IsISO8601()
  dataExpiracao?: string

  @IsOptional()
  @IsString()
  motivo?: string
}
