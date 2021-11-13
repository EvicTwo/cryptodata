import 'colors'

import { BullModule } from '@nestjs/bull'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { NestExpressApplication } from '@nestjs/platform-express'
import { WsAdapter } from '@nestjs/platform-ws'

import { AppModule } from './app.module'

// For HOT reload
declare const module: any

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Get env config
  const configService = app.get(ConfigService)
  const env = configService.get<string>('NODE_ENV')

  // Server's host/port
  const HOST = configService.get('SERVER_HOST')
  const PORT = configService.get('SERVER_PORT')

  /**
   * Microservices
   */
  const microserviceBull = await NestFactory.createMicroservice<MicroserviceOptions>(BullModule, {
    transport: Transport.REDIS,
    options: {
      // url: 'redis://localhost:6379',
      host: configService.get<string>('REDIS_SERVER_HOST'),
      port: configService.get<number>('REDIS_SERVER_PORT'),
      retryAttempts: 15,
      retryDelay: 10000  // ms
    },
  })

  await microserviceBull.listenAsync()

  /**
   * Socket
   */
  app.useWebSocketAdapter(new WsAdapter(app))

  /**
   * Server starts here
   */
  await app.listen(PORT, HOST, () => {
    console.log(`Listening on ${PORT}`.green)
  })

  /**
   * HOT reload
   */
  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}
bootstrap()
