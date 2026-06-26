import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { CarreirasService } from './carreiras.service'
import {
  CriarCarreiraDto,
  AtualizarCarreiraDto,
  CriarFaixaDto,
} from './dto/carreira.dto'

@Controller('carreiras')
export class CarreirasController {
  constructor(private readonly carreiras: CarreirasService) {}

  @Post()
  criar(@Body() dto: CriarCarreiraDto) {
    return this.carreiras.criar(dto)
  }

  @Get()
  listar() {
    return this.carreiras.listar()
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarCarreiraDto) {
    return this.carreiras.atualizar(id, dto)
  }

  @Post(':id/faixas')
  adicionarFaixa(@Param('id') id: string, @Body() dto: CriarFaixaDto) {
    return this.carreiras.adicionarFaixa(id, dto)
  }
}
