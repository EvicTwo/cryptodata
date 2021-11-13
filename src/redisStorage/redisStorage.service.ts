import Redis from 'ioredis'
import { ICryptoDbData } from 'src/types'

import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class RedisService {
  constructor(
    @Inject('RedisClient') private client: Redis.Redis
  ) { }

  /**
   * Stores ICryptoDbData in Redis with prefix key 'crypto:'
   *
   * @param {ICryptoDbData} data
   * @memberof RedisService
   */
  async storeInRedis(data: ICryptoDbData) {

    // cant use nested objects with hset. so stringify
    this.client.set(`crypto:${data.fsym}-${data.tsym}`, JSON.stringify(data))
  }

  /**
   * Retrieves crypto data from RedisStorage
   * Provide currency pair (ex.: BTC-USD)
   *
   * @param {string} [currencyPair]
   * @returns {(Promise<string | string[]>)}
   * @memberof RedisService
   */
  async retrieveFromRedis(currencyPair?: string): Promise<string | ICryptoDbData | ICryptoDbData[]> {
    if (currencyPair) {
      return await this.client.get(`crypto:${currencyPair}`).then((result) => {
        if (!result) return `No result for crypto:${currencyPair}`

        return JSON.parse(result) as ICryptoDbData
      })
    } else {
      const result: ICryptoDbData[] = []

      // obtain keys
      const keys = await this.client.keys('crypto:*')

      // bail if nothing is found
      if (!keys) return 'No result for crypto:*'

      // obtain values of those keys
      for (const key of keys) {
        const value = await this.client.get(key)

        if (value) result.push(JSON.parse(value))
      }

      return result
    }
  }
}
