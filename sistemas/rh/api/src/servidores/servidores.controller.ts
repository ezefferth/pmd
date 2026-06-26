import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ServidoresService } from './servidores.service'
import {
  CriarServidorDto,
  AtualizarSituacaoDto,
  ListarServidoresDto,
} from './dto/servidor.dto'

@Controller('servidores')
export class ServidoresController {
  constructor(private readonly servidores: ServidoresService) {}

  @Post()
  criar(@Body() dto: CriarServidorDto) {
    return this.servidores.criar(dto)
  }

  @Get()
  listar(@Query() dto: ListarServidoresDto) {
    return this.servidores.listar(dto)
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.servidores.buscarPorId(id)
  }

  @Patch(':id/situacao')
  alterarSituacao(@Param('id') id: string, @Body() dto: AtualizarSituacaoDto) {
    return this.servidores.alterarSituacao(id, dto.situacao)
  }
}
