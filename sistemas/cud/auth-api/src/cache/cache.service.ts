import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

/**
 * Cache da verificação de acesso (RN-CUD-021). Degrada graciosamente:
 * se o Redis estiver indisponível, as operações viram no-op (sem derrubar a API).
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name)
  private readonly redis: Redis

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })
    this.redis.on('error', () => {
      // evita ruído: erro de conexão não deve quebrar a aplicação
    })
    void this.redis.connect().catch(() => {
      this.logger.warn('Redis indisponível — verificação seguirá sem cache')
    })
  }

  async obter<T>(chave: string): Promise<T | null> {
    try {
      const valor = await this.redis.get(chave)
      return valor ? (JSON.parse(valor) as T) : null
    } catch {
      return null
    }
  }

  async salvar(chave: string, valor: unknown, ttlSegundos: number): Promise<void> {
    try {
      await this.redis.set(chave, JSON.stringify(valor), 'EX', ttlSegundos)
    } catch {
      // no-op
    }
  }

  async invalidar(chave: string): Promise<void> {
    try {
      await this.redis.del(chave)
    } catch {
      // no-op
    }
  }

  onModuleDestroy(): void {
    this.redis.disconnect()
  }
}
