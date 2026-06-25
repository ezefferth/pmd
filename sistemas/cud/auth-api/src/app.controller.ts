import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get('saude')
  verificarSaude() {
    return { status: 'ok', servico: 'cud-auth-api' }
  }
}
