import { Module } from '@nestjs/common'
import { ServidoresController } from './servidores.controller'
import { ServidoresService } from './servidores.service'

@Module({
  controllers: [ServidoresController],
  providers: [ServidoresService],
})
export class ServidoresModule {}
