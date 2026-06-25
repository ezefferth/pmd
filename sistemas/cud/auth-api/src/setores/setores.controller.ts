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
import { Usuario } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGlobalGuard } from '../auth/guards/admin-global.guard'
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator'
import { Contexto, ContextoRequisicao } from '../comum/contexto'
import { SetoresService } from './setores.service'
import { CriarSetorDto } from './dto/criar-setor.dto'
import { AtualizarSetorDto } from './dto/atualizar-setor.dto'
import { NomearAdminDto } from './dto/nomear-admin.dto'
import { DefinirLotacaoDto } from './dto/definir-lotacao.dto'

@UseGuards(JwtAuthGuard)
@Controller('setores')
export class SetoresController {
  constructor(private readonly setores: SetoresService) {}

  @Get()
  listar() {
    return this.setores.listarArvore()
  }

  // rota estática antes de :id
  @Get('meu-escopo')
  meuEscopo(@UsuarioAtual() usuario: Usuario) {
    return this.setores.resolverEscopo(usuario.id)
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.setores.buscarPorId(id)
  }

  // estrutura: somente admin global (origem futura = sync RH)
  @UseGuards(AdminGlobalGuard)
  @Post()
  criar(@Body() dto: CriarSetorDto) {
    return this.setores.criar(dto)
  }

  @UseGuards(AdminGlobalGuard)
  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarSetorDto) {
    return this.setores.atualizar(id, dto)
  }

  @UseGuards(AdminGlobalGuard)
  @Delete(':id')
  desativar(@Param('id') id: string) {
    return this.setores.desativar(id)
  }

  // administração delegada — escopo verificado no service
  @Get(':id/administradores')
  listarAdmins(@Param('id') id: string) {
    return this.setores.listarAdmins(id)
  }

  @Post(':id/administradores')
  nomearAdmin(
    @Param('id') id: string,
    @Body() dto: NomearAdminDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.setores.nomearAdmin(id, dto.usuarioId, contexto)
  }

  @Delete(':id/administradores/:usuarioId')
  removerAdmin(
    @Param('id') id: string,
    @Param('usuarioId') usuarioId: string,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.setores.removerAdmin(id, usuarioId, contexto)
  }

  @Patch(':id/lotacao')
  definirLotacao(
    @Param('id') id: string,
    @Body() dto: DefinirLotacaoDto,
    @Contexto() contexto: ContextoRequisicao,
  ) {
    return this.setores.definirLotacao(id, dto.usuarioId, contexto)
  }
}
