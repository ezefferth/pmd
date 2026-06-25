import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { Usuario } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGlobalGuard } from '../auth/guards/admin-global.guard'
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator'
import { AcessosService } from './acessos.service'
import { ConcederAcessoDto } from './dto/conceder-acesso.dto'
import { RevogarAcessoDto } from './dto/revogar-acesso.dto'
import { VerificarAcessoDto } from './dto/verificar-acesso.dto'

@Controller('acessos')
export class AcessosController {
  constructor(private readonly acessos: AcessosService) {}

  // Contrato de integração — consumido pelos sistemas (RN-CUD-020)
  // TODO: proteger por credencial de sistema (API key) — hoje aberto p/ MVP local
  @Get('verificar')
  verificar(@Query() dto: VerificarAcessoDto) {
    return this.acessos.verificar(dto)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Post()
  conceder(@Body() dto: ConcederAcessoDto, @UsuarioAtual() admin: Usuario) {
    return this.acessos.conceder(dto, admin.id)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Post('revogar')
  revogar(@Body() dto: RevogarAcessoDto) {
    return this.acessos.revogar(dto.usuarioId, dto.sistemaId)
  }

  @UseGuards(JwtAuthGuard, AdminGlobalGuard)
  @Get('usuario/:usuarioId')
  listarPorUsuario(@Param('usuarioId') usuarioId: string) {
    return this.acessos.listarPorUsuario(usuarioId)
  }
}
