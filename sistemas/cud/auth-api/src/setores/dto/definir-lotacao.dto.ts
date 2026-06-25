import { IsString } from 'class-validator'

export class DefinirLotacaoDto {
  @IsString()
  usuarioId!: string
}
