import { Job } from 'bull'
import { CryptoData } from 'src/models/cryptodata.model'
import { ICryptoDbData } from 'src/types'

import { OnQueueActive, Process, Processor } from '@nestjs/bull'
import { InjectModel } from '@nestjs/sequelize'

@Processor('BULL_QUEUE')
export class BullConsumer {
  constructor(
    @InjectModel(CryptoData) private cryptoModel: typeof CryptoData
  ) { }

  @Process('jobStoreCryptoInDb')
  async jobStoreCryptoInDb(job: Job<ICryptoDbData>) {
    const { RAW, DISPLAY, fsym, tsym } = job.data

    console.info(`Saving pair ${fsym}-${tsym} in MySQL`)

    await this.cryptoModel.create({
      RAW,
      DISPLAY,
      fsym,
      tsym
    })

    return
  }

  // For debug
  // @OnQueueActive()
  // onActive(job: Job) {
  //   console.log(`Processing job ${job.id} of type ${job.name} with data ${job.data}...`)
  // }

}
