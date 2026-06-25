import { IsString } from 'class-validator'

export class RevogarAcessoDto {
  @IsString()
  usuarioId!: string

  @IsString()
  sistemaId!: string
}
