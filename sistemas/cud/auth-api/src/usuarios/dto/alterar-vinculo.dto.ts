import { IsEnum, IsOptional, IsString } from 'class-validator'
import { TipoVinculo } from '@prisma/client'

export class AlterarVinculoDto {
  @IsEnum(TipoVinculo)
  tipoVinculo!: TipoVinculo

  // obrigatória ao virar EFETIVO/COMISSIONADO (se ainda não houver); ignorada p/ estagiário/externo
  @IsOptional()
  @IsString()
  matricula?: string
}
