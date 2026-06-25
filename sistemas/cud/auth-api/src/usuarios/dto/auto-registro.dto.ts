import { IsEmail, IsString, MinLength } from 'class-validator'

// Autoregistro público — o usuário nasce EXTERNO (RN-CUD-046)
export class AutoRegistroDto {
  @IsString()
  @MinLength(3)
  nome!: string

  @IsEmail()
  email!: string

  @IsString()
  cpf!: string

  @IsString()
  @MinLength(8)
  senha!: string
}
