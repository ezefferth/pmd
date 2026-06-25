import { IsEnum } from 'class-validator'
import { StatusUsuario } from '@prisma/client'

export class AlterarStatusDto {
  @IsEnum(StatusUsuario)
  status!: StatusUsuario
}
