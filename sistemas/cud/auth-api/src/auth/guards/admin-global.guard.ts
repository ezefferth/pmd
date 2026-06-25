import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'

// Deve ser usado após o JwtAuthGuard (que popula req.usuario)
@Injectable()
export class AdminGlobalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    if (!req.usuario?.ehAdminGlobal) {
      throw new ForbiddenException('Requer administrador global')
    }
    return true
  }
}
