import { IsString, MinLength } from 'class-validator'

export class AlterarSenhaDto {
  @IsString()
  @MinLength(8)
  senha!: string
}
