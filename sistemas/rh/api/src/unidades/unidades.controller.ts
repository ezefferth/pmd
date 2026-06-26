import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { UnidadesService } from './unidades.service'
import { CriarUnidadeDto, AtualizarUnidadeDto } from './dto/unidade.dto'

@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidades: UnidadesService) {}

  @Post()
  criar(@Body() dto: CriarUnidadeDto) {
    return this.unidades.criar(dto)
  }

  @Get()
  listar() {
    return this.unidades.listarArvore()
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.unidades.buscarPorId(id)
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarUnidadeDto) {
    return this.unidades.atualizar(id, dto)
  }

  @Delete(':id')
  desativar(@Param('id') id: string) {
    return this.unidades.desativar(id)
  }
}
