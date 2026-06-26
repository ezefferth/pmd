import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AcessosModule } from '../acessos/acessos.module'
import { GruposAcessoController } from './grupos-acesso.controller'
import { GruposAcessoService } from './grupos-acesso.service'

@Module({
  imports: [AuthModule, AcessosModule],
  controllers: [GruposAcessoController],
  providers: [GruposAcessoService],
})
export class GruposAcessoModule {}
