import { Global, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AuditoriaController } from './auditoria.controller'
import { AuditoriaService } from './auditoria.service'

// Global: AuditoriaService fica disponível a todos os módulos de domínio
@Global()
@Module({
  imports: [AuthModule],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
