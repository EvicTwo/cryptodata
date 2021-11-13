import Redis from 'ioredis'

import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { RedisService } from './redisStorage.service'

@Module({
    imports: [],
    providers: [
        RedisService,
        {
            provide: 'RedisClient',
            useFactory: async (configService: ConfigService) => {
                const RedisClient = new Redis({
                    host: configService.get<string>('REDIS_SERVER_HOST'),
                    port: configService.get<number>('REDIS_SERVER_PORT')
                })
                return RedisClient
            },
            inject: [ConfigService],
        }
    ],
    exports: [RedisService]
})
export class RedisStorageModule { }
