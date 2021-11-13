import { JobStatus, Queue } from 'bull'
import { ICryptoDbData } from 'src/types'

import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'

@Injectable()
export class BullService {

  constructor(
    @InjectQueue('BULL_QUEUE') private jobQueue: Queue,
  ) { }

  async jobStoreCryptoInDb(cryptoData: ICryptoDbData): Promise<void> {
    await this.jobQueue.add('jobStoreCryptoInDb', cryptoData)
  }

  async getJobs(types: JobStatus[]) {
    return await this.jobQueue.getJobs(types)
  }

  async emptyQueue() {
    console.log(`Draining the queue...`)
    await this.jobQueue.empty()
  }
}
