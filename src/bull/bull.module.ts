import Bull from 'bull'
import { CryptoData } from 'src/models/cryptodata.model'

import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'

import { BullConsumer } from './bull.consumer'
import { BullService } from './bull.service'

@Module({
    imports: [
        SequelizeModule.forFeature([CryptoData]),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService): Promise<Bull.QueueOptions> => {
                const bullConfig: Bull.QueueOptions = {
                    redis: {
                        // path: configService.get<string>('REDIS_SERVER_URI')
                        host: configService.get<string>('REDIS_SERVER_HOST'),
                        port: configService.get<number>('REDIS_SERVER_PORT'),
                    }
                }
                return bullConfig
            },
            inject: [ConfigService]
        }),
        BullModule.registerQueue({
            name: 'BULL_QUEUE',
        })
    ],
    providers: [
        BullService,
        BullConsumer
    ],
    exports: [BullService]
})
export class BullQueueModule { }
