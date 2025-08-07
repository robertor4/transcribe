import { Module, Global } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { FirebaseModule } from '../firebase/firebase.module';

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [WebSocketGateway],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}