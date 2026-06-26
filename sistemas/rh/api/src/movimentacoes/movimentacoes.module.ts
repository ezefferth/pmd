import { Controller, Get, Injectable, Module, Query } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MovimentacoesService {
  constructor(private readonly prisma: PrismaService) {}

  listarPorServidor(servidorId: string) {
    return this.prisma.movimentacaoFuncional.findMany({
      where: { servidorId },
      orderBy: { data: 'desc' },
    })
  }
}

@Controller('movimentacoes')
export class MovimentacoesController {
  constructor(private readonly movimentacoes: MovimentacoesService) {}

  // GET /movimentacoes?servidorId=...
  @Get()
  listar(@Query('servidorId') servidorId: string) {
    return this.movimentacoes.listarPorServidor(servidorId)
  }
}

@Module({
  controllers: [MovimentacoesController],
  providers: [MovimentacoesService],
})
export class MovimentacoesModule {}
