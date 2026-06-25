import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGlobalGuard } from '../auth/guards/admin-global.guard'
import { SistemasService } from './sistemas.service'
import { CriarSistemaDto } from './dto/criar-sistema.dto'
import { AtualizarSistemaDto } from './dto/atualizar-sistema.dto'

@UseGuards(JwtAuthGuard, AdminGlobalGuard)
@Controller('sistemas')
export class SistemasController {
  constructor(private readonly sistemas: SistemasService) {}

  @Post()
  criar(@Body() dto: CriarSistemaDto) {
    return this.sistemas.criar(dto)
  }

  @Get()
  listar() {
    return this.sistemas.listar()
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.sistemas.buscarPorId(id)
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarSistemaDto) {
    return this.sistemas.atualizar(id, dto)
  }
}
