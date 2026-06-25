import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SetoresController } from './setores.controller'
import { SetoresService } from './setores.service'

@Module({
  imports: [AuthModule],
  controllers: [SetoresController],
  providers: [SetoresService],
  exports: [SetoresService],
})
export class SetoresModule {}
