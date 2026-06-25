import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGlobalGuard } from '../auth/guards/admin-global.guard'
import { PerfisService } from './perfis.service'
import { CriarPerfilDto } from './dto/criar-perfil.dto'
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto'

@UseGuards(JwtAuthGuard, AdminGlobalGuard)
@Controller('perfis')
export class PerfisController {
  constructor(private readonly perfis: PerfisService) {}

  @Post()
  criar(@Body() dto: CriarPerfilDto) {
    return this.perfis.criar(dto)
  }

  // GET /perfis?sistemaId=...
  @Get()
  listar(@Query('sistemaId') sistemaId: string) {
    return this.perfis.listarPorSistema(sistemaId)
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarPerfilDto) {
    return this.perfis.atualizar(id, dto)
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.perfis.excluir(id)
  }
}
