import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { UnidadesModule } from './unidades/unidades.module'
import { CarreirasModule } from './carreiras/carreiras.module'
import { CargosModule } from './cargos/cargos.module'
import { ServidoresModule } from './servidores/servidores.module'
import { MovimentacoesModule } from './movimentacoes/movimentacoes.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UnidadesModule,
    CarreirasModule,
    CargosModule,
    ServidoresModule,
    MovimentacoesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
