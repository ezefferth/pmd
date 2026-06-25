import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AdminGlobalGuard } from './guards/admin-global.guard'

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, AdminGlobalGuard],
  exports: [JwtAuthGuard, AdminGlobalGuard],
})
export class AuthModule {}
