import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SistemasController } from './sistemas.controller'
import { SistemasService } from './sistemas.service'

@Module({
  imports: [AuthModule],
  controllers: [SistemasController],
  providers: [SistemasService],
})
export class SistemasModule {}
