import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ToggleLockEventDto } from './dto/toggle-lock-event.dto';

@WebSocketGateway()
export class ModuleGateway {
  @SubscribeMessage('toggle-lock')
  async handleToggleLock(
    @MessageBody() toggleLockEventDto: ToggleLockEventDto,
  ) {
    const { lockerId, macAddress, isOpen } = toggleLockEventDto;
    return { lockerId, macAddress, isOpen };
  }
}
