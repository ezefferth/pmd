import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/** Protege a sincronização RH→CUD por credencial de sistema (header x-sync-key). */
@Injectable()
export class SyncKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const chave = req.headers?.['x-sync-key']
    const esperada = this.config.getOrThrow<string>('CUD_SYNC_KEY')
    if (!chave || chave !== esperada) {
      throw new UnauthorizedException('Credencial de sincronização inválida')
    }
    return true
  }
}
