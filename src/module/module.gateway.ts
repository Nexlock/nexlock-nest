import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { SetupService } from '../setup/setup.service';

@WebSocketGateway({
  path: '/ws',
})
export class ModuleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedModules = new Map<string, WebSocket>();

  constructor(private setupService: SetupService) {}

  handleConnection(client: WebSocket) {
    console.log('WebSocket client connected');
  }

  handleDisconnect(client: WebSocket) {
    console.log('WebSocket client disconnected');

    // Remove from connected modules
    for (const [moduleId, socket] of this.connectedModules.entries()) {
      if (socket === client) {
        this.connectedModules.delete(moduleId);
        console.log(`Module ${moduleId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('module-register')
  async handleModuleRegister(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { macAddress: string; otp: string },
  ) {
    console.log('Module registration attempt:', data);

    try {
      // Verify OTP and get the module
      const oneTimePassword = await this.setupService.findValidOtp(
        data.macAddress,
        data.otp,
      );

      if (!oneTimePassword) {
        this.sendMessage(client, {
          type: 'registration-failed',
          error: 'Invalid or expired OTP',
        });
        return { success: false, error: 'Invalid or expired OTP' };
      }

      // Mark OTP as used
      await this.setupService.markOtpAsUsed(oneTimePassword.id);

      // Store the client with module mapping
      this.connectedModules.set(oneTimePassword.module.id, client);

      this.sendMessage(client, {
        type: 'module-registered',
        moduleId: oneTimePassword.module.id,
        message: 'Module registered successfully',
      });

      console.log(
        `Module ${oneTimePassword.module.id} registered successfully`,
      );

      return { success: true, moduleId: oneTimePassword.module.id };
    } catch (error) {
      console.error('Registration error:', error);
      this.sendMessage(client, {
        type: 'registration-failed',
        error: 'Registration failed',
      });
      return { success: false, error: 'Registration failed' };
    }
  }

  @SubscribeMessage('locker-status-update')
  async handleLockerStatusUpdate(
    @ConnectedSocket() client: WebSocket,
    @MessageBody()
    data: { moduleId: string; lockerId: string; isOpen: boolean },
  ) {
    console.log('Locker status update:', data);

    try {
      await this.setupService.updateLockerStatus(data.lockerId, data.isOpen);
      this.sendMessage(client, {
        type: 'status-update-ack',
        success: true,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to update locker status:', error);
      this.sendMessage(client, {
        type: 'status-update-ack',
        success: false,
        error: 'Failed to update status',
      });
      return { success: false, error: 'Failed to update status' };
    }
  }

  @SubscribeMessage('module-status')
  async handleModuleStatus(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { moduleId: string; macAddress: string; status: any },
  ) {
    console.log('Module status update:', data);

    this.sendMessage(client, {
      type: 'status-received',
      received: true,
    });

    return { received: true };
  }

  @SubscribeMessage('ping')
  async handlePing(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { moduleId: string },
  ) {
    this.sendMessage(client, {
      type: 'pong',
      timestamp: Date.now(),
    });

    return { type: 'pong', timestamp: Date.now() };
  }

  // Method to send commands to modules from admin interface
  sendLockCommand(moduleId: string, lockerId: string, shouldLock: boolean) {
    const client = this.connectedModules.get(moduleId);
    if (client && client.readyState === WebSocket.OPEN) {
      const eventName = shouldLock ? 'lock-command' : 'unlock-command';
      this.sendMessage(client, {
        type: eventName,
        lockerId,
        timestamp: Date.now(),
      });
      console.log(
        `Sent ${eventName} to module ${moduleId} for locker ${lockerId}`,
      );
    } else {
      console.log(`Module ${moduleId} not connected or not ready`);
    }
  }

  // Method to broadcast to all connected modules
  broadcastToAllModules(message: any) {
    for (const [moduleId, client] of this.connectedModules.entries()) {
      if (client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
      }
    }
  }

  // Get connection status for a specific module
  isModuleConnected(moduleId: string): boolean {
    const client = this.connectedModules.get(moduleId);
    return client ? client.readyState === WebSocket.OPEN : false;
  }

  // Get all connected module IDs
  getConnectedModules(): string[] {
    const connectedIds: string[] = [];
    for (const [moduleId, client] of this.connectedModules.entries()) {
      if (client.readyState === WebSocket.OPEN) {
        connectedIds.push(moduleId);
      }
    }
    return connectedIds;
  }

  private sendMessage(client: WebSocket, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}
