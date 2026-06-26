import { Module } from '@nestjs/common'
import { CarreirasController } from './carreiras.controller'
import { CarreirasService } from './carreiras.service'

@Module({
  controllers: [CarreirasController],
  providers: [CarreirasService],
})
export class CarreirasModule {}
