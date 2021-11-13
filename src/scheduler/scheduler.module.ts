import { BullQueueModule } from 'src/bull/bull.module'

import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppModule } from '../app.module'
import { RedisStorageModule } from '../redisStorage/redisStorage.module'
import { SchedulerService } from './scheduler.service'

@Module({
    imports: [
        ConfigModule,
        BullQueueModule,
        RedisStorageModule,
        forwardRef(() => AppModule)
    ],
    controllers: [],
    providers: [
        SchedulerService,],
})
export class SchedulerModule { }
