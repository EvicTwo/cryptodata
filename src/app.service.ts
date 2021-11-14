import 'colors'

import url from 'url'

import { HttpService, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/sequelize'

import { CryptoData } from './models/cryptodata.model'
import { RedisService } from './redisStorage/redisStorage.service'
import { ICryptoDbData } from './types'

// TODO: get them from configService or somewhere?
const cryptoDataNeededKeys = [
  'CHANGE24HOUR',
  'CHANGEPCT24HOUR',
  'OPEN24HOUR',
  'VOLUME24HOUR',
  'VOLUME24HOURTO',
  'LOW24HOUR',
  'HIGH24HOUR',
  'PRICE',
  'SUPPLY',
  'MKTCAP',
]

@Injectable()
export class AppService {
  private fsyms: string[]
  private tsyms: string[]

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private redisStorage: RedisService,
    @InjectModel(CryptoData) private cryptoModel: typeof CryptoData,

  ) {
    // Get currencies
    try {
      this.fsyms = JSON.parse(configService.get<string>('FSYMS') as string)
      this.tsyms = JSON.parse(configService.get<string>('TSYMS') as string)

    } catch (error) {
      throw new Error(`Can't parse FSYMS or TSYMS env var`.red)
    }

  }


  fromRedis(currPair: string) {
    return this.redisStorage.retrieveFromRedis(currPair)
  }

  /**
   * Makes a request to Crypto API and trasnforms response on success.
   * If data from MySQL is not needed for fallback - provide { fromDb: false }
   * 
   * @param {{ fsym?: string, tsym?: string, fromDb?: boolean }}
   * @returns Promise<ICryptoDbData | ICryptoDbData[] | null>
   * @memberof AppService
   */
  async requestCryptoAPI({ fsym, tsym, fromDb = true }: { fsym?: string, tsym?: string, fromDb?: boolean }) {

    // if pairs aren't provided - get them from our .env
    const fsyms = fsym ? fsym : this.fsyms
    const tsyms = tsym ? tsym : this.tsyms

    // make query for fsyms and tsyms
    const query = new url.URLSearchParams({
      fsyms,
      tsyms
    })

    const resp = await this.httpService.get(`/data/pricemultifull?${query}`).toPromise().catch(err => {
      // Request failed for whatever reason.
      console.info(`Bad response from API. ${err}`)

      return null
    })

    // Fallback
    if (!resp) {

      // return from database
      if (fromDb) {
        console.info('Returning data from MySQL...')

        // TODO: cant do it with array yet..
        if (Array.isArray(fsyms) || Array.isArray(tsyms)) throw new Error(`Requested a fsyms array from MySQL. Not implemented.`)

        // retrieve data
        const fromMySQL = await this.findCrypto(fsyms, tsyms)

        // format and return
        return fromMySQL ? this.formatForOutput([fromMySQL]) : null

      } else {
        // Do nothing?
        return null
      }
    }

    // transform and filter
    const cryptoData = this.transformApiResponse(resp.data)

    // update data in redis
    cryptoData.forEach(crypto => this.redisStorage.storeInRedis(crypto))

    // format and return
    return this.formatForOutput(cryptoData)
  }

  /**
   * Takes response and transforms it into database's model.
   * Also filters out not needed keys
   *
   * @returns ICryptoDbData[]
   * @memberof AppService
   */
  transformApiResponse = (response: { RAW: {}, DISPLAY: {} }): ICryptoDbData[] => {

    // bail on a bad response
    if (!response.hasOwnProperty('RAW') || !response.hasOwnProperty('DISPLAY')) throw new Error(`Crypto data doesn't have RAW or DISPLAY keys.`)

    let cryptoMap = new Map()

    Object.entries(response).forEach(entry => {
      const [key, value] = entry

      let datatype = key // RAW or DISPLAY

      Object.entries<object>(value).forEach(fsym => {  // fsym is BTC: {}
        const [fsymKey, fsymValue] = fsym

        Object.entries(fsymValue).forEach(tsym => {
          const [tsymKey, tsymValue] = tsym

          // filter not needed keys
          const filtered = Object.keys(tsymValue)
            .filter(key => cryptoDataNeededKeys.includes(key))
            .reduce((obj: Record<string, unknown>, key) => {
              return {
                ...obj,
                [key]: tsymValue[key]
              }
            }, {})

          // define a key for Map
          const mapkey = `${fsymKey}-${tsymKey}`

          const inMap = cryptoMap.get(mapkey)

          if (inMap) {
            cryptoMap.set(mapkey, {
              ...inMap,
              [datatype]: filtered
            })
          } else {
            cryptoMap.set(mapkey, {
              fsym: fsymKey,
              tsym: tsymKey,
              [datatype]: filtered
            })
          }

        })
      })
    })

    return Array.from(cryptoMap.values())
  }


  /**
   * Retrieves latest currency pair's data from MySQL
   *
   * @param {string} fsym
   * @param {string} tsym
   * @returns Promise<CryptoData | null>
   * @memberof AppService
   */
  async findCrypto(fsym: string, tsym: string) {
    return await this.cryptoModel.findOne({
      where: {
        fsym,
        tsym
      },
      attributes: ['RAW', 'DISPLAY', 'fsym', 'tsym'],
      order: [['createdAt', 'DESC']],
      raw: true
    })
  }


  /**
   * Formats ICryptoDbData[] for output
   * 
   * @memberof AppService
   */
  formatForOutput(cryptoData: ICryptoDbData[]) {
    const properFormat = cryptoData.map(crypto => {

      if (!crypto.RAW || !crypto.DISPLAY) throw new Error(`Can't format that`)

      return {
        RAW: {
          [crypto.fsym]: {
            [crypto.tsym]: crypto.RAW
          }
        },
        DISPLAY: {
          [crypto.fsym]: {
            [crypto.tsym]: crypto.DISPLAY
          }
        }
      }
    })

    return properFormat
  }
}
