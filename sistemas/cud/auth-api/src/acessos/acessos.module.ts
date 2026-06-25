import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AcessosController } from './acessos.controller'
import { AcessosService } from './acessos.service'

@Module({
  imports: [AuthModule],
  controllers: [AcessosController],
  providers: [AcessosService],
})
export class AcessosModule {}
