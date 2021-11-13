import { AxiosResponse } from 'axios'
import { Observable } from 'rxjs'

import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common'

import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService
  ) { }

  @Get('/price')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCryptoData(@Query('fsyms') fsym: string, @Query('tsyms') tsym: string) {
    return await this.appService.requestCryptoAPI({ fsym, tsym })
  }
}
