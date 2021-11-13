import { ICryptoDbData } from 'src/types'

import { Injectable } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'

import { AppService } from '../app.service'
import { BullService } from '../bull/bull.service'
import { RedisService } from '../redisStorage/redisStorage.service'

@Injectable()
export class SchedulerService {
  constructor(
    private bullService: BullService,
    private redisStorage: RedisService,
    private appService: AppService
  ) { }

  @Interval(2 * 60 * 1000)  // ms
  async requestNewCryptoData() {
    console.info(`Requesting data from an API by interval`)

    this.appService.requestCryptoAPI({ fromDb: false })
  }

  @Interval(10 * 60 * 1000)
  async addJobStoreInMysql() {

    // get crypto data from redisStorage
    const fromRedis = await this.redisStorage.retrieveFromRedis() as ICryptoDbData[]

    // add jobs to store
    fromRedis.forEach(crypto => this.bullService.jobStoreCryptoInDb(crypto))
  }
}