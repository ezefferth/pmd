import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGlobalGuard } from '../auth/guards/admin-global.guard'
import { Contexto, ContextoRequisicao } from '../comum/contexto'
import { GruposAcessoService } from './grupos-acesso.service'
import { CriarGrupoAcessoDto } from './dto/criar-grupo-acesso.dto'
import { AtualizarGrupoAcessoDto } from './dto/atualizar-grupo-acesso.dto'
import { AplicarGrupoAcessoDto } from './dto/aplicar-grupo-acesso.dto'

@UseGuards(JwtAuthGuard, AdminGlobalGuard)
@Controller('grupos-acesso')
export class GruposAcessoController {
  constructor(private readonly grupos: GruposAcessoService) {}

  @Post()
  criar(@Body() dto: CriarGrupoAcessoDto, @Contexto() contexto: ContextoRequisicao) {
    return this.grupos.criar(dto, contexto)
  }

  @Get()
  listar() {
    return this.grupos.listar()
  }

  @Get(':id')
  obter(@Param('id') id: string) {
    return this.grupos.obter(id)
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarGrupoAcessoDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.grupos.atualizar(id, dto, contexto)
  }

  @Delete(':id')
  excluir(@Param('id') id: string, @Contexto() contexto: ContextoRequisicao) {
    return this.grupos.excluir(id, contexto)
  }

  @Post(':id/aplicar')
  aplicar(
    @Param('id') id: string,
    @Body() dto: AplicarGrupoAcessoDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.grupos.aplicar(id, dto.usuarioId, dto.motivo, contexto)
  }
}
