import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { StatusUsuario, TipoVinculo } from '@prisma/client'

export class ListarUsuariosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 20

  @IsOptional()
  @IsString()
  busca?: string

  @IsOptional()
  @IsEnum(StatusUsuario)
  status?: StatusUsuario

  @IsOptional()
  @IsEnum(TipoVinculo)
  tipoVinculo?: TipoVinculo
}
