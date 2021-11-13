import { forwardRef, HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { BullQueueModule } from './bull/bull.module'
import { CryptoData } from './models/cryptodata.model'
import { RedisStorageModule } from './redisStorage/redisStorage.module'
import { SchedulerModule } from './scheduler/scheduler.module'
import { CryptoSocket } from './socket/cryptoSocket.module'

@Module({
  imports: [
    forwardRef(() => SchedulerModule),
    BullQueueModule,
    RedisStorageModule,
    forwardRef(() => CryptoSocket),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      // paths for files. First one takes precedence.
      envFilePath: ['.env', '.env.development'],

      // If you don't need to load env file, just igore it.
      ignoreEnvFile: false,

      // If set to Global, you don't need to import ConfigModule in other modules
      isGlobal: true
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<SequelizeModuleOptions> => {
        const env = configService.get<string>('NODE_ENV')

        let sequelizeConfig: SequelizeModuleOptions

        // Different DBs for different environments
        switch (env) {
          case 'development':
            sequelizeConfig = {
              dialect: 'sqlite',
              storage: configService.get<string>('SQLITE3_STORAGE'),
              synchronize: true,
              autoLoadModels: true
            }
            break
          case 'production':
            sequelizeConfig = {
              dialect: 'mysql',
              host: configService.get<string>('MYSQL_HOST'),
              port: configService.get<number>('MYSQL_PORT'),
              database: configService.get<string>('MYSQL_DB'),
              username: configService.get<string>('MYSQL_USER'),
              password: configService.get<string>('MYSQL_PASS'),
              synchronize: true,
              autoLoadModels: true
            }
            break

          default:
            throw new Error(`Something is wrong with sequelize's config!`)
        }

        return sequelizeConfig
      },
      inject: [ConfigService]
    }),
    SequelizeModule.forFeature([CryptoData]),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('CRYPTO_API_URL'),

        // msec timeout
        // TODO: maybe take these values from a .env
        timeout: 3000,

        // follow up to 5 HTTP 3xx redirects
        maxRedirects: 5,

        // cap the maximum content length we'll accept to 50MBs, just in case
        maxContentLength: 50 * 1000 * 1000
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService]
})
export class AppModule { }
