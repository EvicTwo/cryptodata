import { Server } from 'ws'

import { forwardRef, Inject } from '@nestjs/common'
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'

import { AppService } from '../app.service'

@WebSocketGateway({
  path: '/price'
})
class CryptoGateway implements OnGatewayConnection {
  constructor(
    @Inject(forwardRef(() => AppService))
    private readonly appService: AppService
  ) { }

  @WebSocketServer()
  server: Server

  handleConnection(client: any): any {
    // listen for any message and respond with crypto data
    client.on('message', async (data: any) => {
      try {
        const { fsyms, tsyms } = JSON.parse(data)

        if (!fsyms || !tsyms) return client.send(`Bad request. Check fsyms: ${fsyms} or tsyms: ${tsyms}`)
        if (typeof fsyms !== 'string' || typeof fsyms !== 'string') return client.send(`Bad request. fmyms and tsyms must be strings`)

        console.info(`WS: ${fsyms}-${tsyms} requested.`)

        client.send(JSON.stringify(await this.appService.requestCryptoAPI({
          fsym: fsyms,
          tsym: tsyms
        })))

      } catch (error) {
        client.send(`Bad request. Only acceptes { fsyms: 'string', tsyms: 'string' }`)
      }
    })
  }

  // TODO: remove if not needed
  // @SubscribeMessage('message')
  // @UsePipes(new ValidationPipe({
  //   transform: true
  // }))
  // async getCryptoData(@MessageBody() currencyPair: any) {
  //   // need responde to
  //   // { "fsyms": "DASH", "tsyms": "RUR" }
  //   // return await this.appService.requestCryptoAPI()
  //   return 'event?'
  // }
}

export { CryptoGateway }