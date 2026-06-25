import { IsEmail } from 'class-validator'

export class AlterarEmailDto {
  @IsEmail()
  email!: string
}
