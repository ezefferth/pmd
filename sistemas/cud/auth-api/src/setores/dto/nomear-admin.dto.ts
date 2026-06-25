import { IsString } from 'class-validator'

export class NomearAdminDto {
  @IsString()
  usuarioId!: string
}
