import { Controller, Module, Post } from '@nestjs/common'
import { CudClient } from './cud.client'
import { SincronizacaoService } from './sincronizacao.service'

@Controller('sincronizacao')
export class SincronizacaoController {
  constructor(private readonly sincronizacao: SincronizacaoService) {}

  // Dispara a sincronização completa RH→CUD (MVP: manual; eventos depois)
  @Post('publicar')
  publicar() {
    return this.sincronizacao.publicarTudo()
  }
}

@Module({
  controllers: [SincronizacaoController],
  providers: [SincronizacaoService, CudClient],
})
export class SincronizacaoModule {}
