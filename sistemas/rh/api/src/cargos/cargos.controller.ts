import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { TipoCargo } from '@prisma/client'
import { CargosService } from './cargos.service'
import { CriarCargoDto, AtualizarCargoDto } from './dto/cargo.dto'

@Controller('cargos')
export class CargosController {
  constructor(private readonly cargos: CargosService) {}

  @Post()
  criar(@Body() dto: CriarCargoDto) {
    return this.cargos.criar(dto)
  }

  @Get()
  listar(@Query('tipo') tipo?: TipoCargo) {
    return this.cargos.listar(tipo)
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarCargoDto) {
    return this.cargos.atualizar(id, dto)
  }
}
