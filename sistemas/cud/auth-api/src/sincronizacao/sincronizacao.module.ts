import { Module } from '@nestjs/common'
import { SincronizacaoController } from './sincronizacao.controller'
import { SincronizacaoService } from './sincronizacao.service'
import { SyncKeyGuard } from './sync-key.guard'

@Module({
  controllers: [SincronizacaoController],
  providers: [SincronizacaoService, SyncKeyGuard],
})
export class SincronizacaoModule {}
