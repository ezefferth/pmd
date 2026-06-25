import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

// Global: o PrismaService fica disponível a todos os módulos sem reimportar
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
