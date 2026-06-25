import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGlobalGuard } from '../auth/guards/admin-global.guard'
import { AuditoriaService } from './auditoria.service'
import { ListarAuditoriaDto } from './dto/listar-auditoria.dto'

// Somente leitura — o log é imutável (RN-CUD-027)
@UseGuards(JwtAuthGuard, AdminGlobalGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  listar(@Query() dto: ListarAuditoriaDto) {
    return this.auditoria.listar(dto)
  }
}
