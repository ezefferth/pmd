import { IsOptional, IsString } from 'class-validator'

export class AplicarGrupoAcessoDto {
  @IsString()
  usuarioId!: string

  @IsOptional()
  @IsString()
  motivo?: string
}
