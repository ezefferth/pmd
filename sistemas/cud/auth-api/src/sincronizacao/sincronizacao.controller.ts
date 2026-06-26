import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { SyncKeyGuard } from './sync-key.guard'
import { SincronizacaoService } from './sincronizacao.service'
import {
  SincronizarSetoresDto,
  SincronizarServidoresDto,
} from './dto/sincronizar.dto'

// Recebe a sincronização do RH — protegido por credencial de sistema (x-sync-key)
@UseGuards(SyncKeyGuard)
@Controller('sincronizacao')
export class SincronizacaoController {
  constructor(private readonly sincronizacao: SincronizacaoService) {}

  @Post('setores')
  setores(@Body() dto: SincronizarSetoresDto) {
    return this.sincronizacao.sincronizarSetores(dto)
  }

  @Post('servidores')
  servidores(@Body() dto: SincronizarServidoresDto) {
    return this.sincronizacao.sincronizarServidores(dto)
  }
}
