import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './app.module'

async function inicializar() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  app.setGlobalPrefix('api/v1')
  // whitelist remove campos não declarados nos DTOs; transform aplica os tipos
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const porta = Number(process.env.PORT) || 3001
  await app.listen({ port: porta, host: '0.0.0.0' })
}

void inicializar()
