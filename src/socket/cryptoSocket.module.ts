import { forwardRef, Module } from '@nestjs/common'

import { AppModule } from '../app.module'
import { CryptoGateway } from './crypto.gateway'

@Module({
    imports: [forwardRef(() => AppModule)],
    providers: [CryptoGateway],
})
export class CryptoSocket { }
