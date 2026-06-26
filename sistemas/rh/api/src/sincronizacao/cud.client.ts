import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/** Client HTTP para publicar dados no CUD (sincronização RH→CUD). */
@Injectable()
export class CudClient {
  private readonly base: string
  private readonly chave: string

  constructor(config: ConfigService) {
    this.base = config.getOrThrow<string>('CUD_API_URL')
    this.chave = config.getOrThrow<string>('CUD_SYNC_KEY')
  }

  async enviar<T = unknown>(caminho: string, corpo: unknown): Promise<T> {
    const resposta = await fetch(`${this.base}${caminho}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-sync-key': this.chave },
      body: JSON.stringify(corpo),
    })
    if (!resposta.ok) {
      throw new Error(`CUD ${resposta.status}: ${await resposta.text()}`)
    }
    return resposta.json() as Promise<T>
  }
}
