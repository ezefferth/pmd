import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGlobalGuard } from '../auth/guards/admin-global.guard'
import { Contexto, ContextoRequisicao } from '../comum/contexto'
import { UsuariosService } from './usuarios.service'
import { CriarUsuarioDto } from './dto/criar-usuario.dto'
import { AutoRegistroDto } from './dto/auto-registro.dto'
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto'
import { AlterarVinculoDto } from './dto/alterar-vinculo.dto'
import { AlterarStatusDto } from './dto/alterar-status.dto'
import { ListarUsuariosDto } from './dto/listar-usuarios.dto'

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  // público — autoregistro de externo (RN-CUD-046)
  @Post('auto-registro')
  autoRegistrar(@Body() dto: AutoRegistroDto, @Contexto() contexto: ContextoRequisicao) {
    return this.usuarios.autoRegistrar(dto, contexto)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Post()
  criar(@Body() dto: CriarUsuarioDto, @Contexto() contexto: ContextoRequisicao) {
    return this.usuarios.criar(dto, contexto)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Get()
  listar(@Query() dto: ListarUsuariosDto) {
    return this.usuarios.listar(dto)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.usuarios.buscarPorId(id)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarUsuarioDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.usuarios.atualizar(id, dto, contexto)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Patch(':id/vinculo')
  alterarVinculo(
    @Param('id') id: string,
    @Body() dto: AlterarVinculoDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.usuarios.alterarVinculo(id, dto, contexto)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Patch(':id/status')
  alterarStatus(
    @Param('id') id: string,
    @Body() dto: AlterarStatusDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.usuarios.alterarStatus(id, dto.status, contexto)
  }
}
