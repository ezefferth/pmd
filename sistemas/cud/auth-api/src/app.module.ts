import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { SupabaseModule } from './supabase/supabase.module'
import { CacheModule } from './cache/cache.module'
import { AuthModule } from './auth/auth.module'
import { UsuariosModule } from './usuarios/usuarios.module'
import { SistemasModule } from './sistemas/sistemas.module'
import { PerfisModule } from './perfis/perfis.module'
import { AcessosModule } from './acessos/acessos.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SupabaseModule,
    CacheModule,
    AuthModule,
    UsuariosModule,
    SistemasModule,
    PerfisModule,
    AcessosModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
