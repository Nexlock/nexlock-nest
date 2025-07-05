import {
  WebSocketGateway,
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

    // Handle raw WebSocket messages (not Socket.IO)
    client.on('message', async (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleRawMessage(client, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.sendMessage(client, {
          type: 'error',
          message: 'Invalid JSON format',
        });
      }
    });
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

  private async handleRawMessage(client: WebSocket, message: any) {
    console.log('Received raw WebSocket message:', message);

    if (!message.type) {
      console.error('Message missing type field:', message);
      return;
    }

    switch (message.type) {
      case 'module-register':
        await this.handleModuleRegister(client, message);
        break;
      case 'locker-status-update':
        await this.handleLockerStatusUpdate(client, message);
        break;
      case 'module-status':
        await this.handleModuleStatus(client, message);
        break;
      case 'ping':
        await this.handlePing(client, message);
        break;
      default:
        console.log('Unknown message type:', message.type);
        this.sendMessage(client, {
          type: 'error',
          message: 'Unknown message type',
        });
    }
  }

  private async handleModuleRegister(
    client: WebSocket,
    data: { macAddress: string; otp: string },
  ) {
    console.log('Module registration attempt:', data);

    try {
      // Verify OTP and get the module
      const oneTimePassword = await this.setupService.findValidOtp(
        data.otp,
        data.macAddress,
      );

      if (!oneTimePassword) {
        this.sendMessage(client, {
          type: 'registration-failed',
          error: 'Invalid or expired OTP',
        });
        return;
      }

      // Mark OTP as used
      await this.setupService.markOtpAsUsed(oneTimePassword.id);

      // Store the client with module mapping
      this.connectedModules.set(oneTimePassword.module.id, client);

      // Send success response to ESP32
      this.sendMessage(client, {
        type: 'module-registered',
        moduleId: oneTimePassword.module.id,
        macAddress: oneTimePassword.module.macAddress,
        message: 'Module registered successfully',
      });

      console.log(
        `Module ${oneTimePassword.module.id} registered successfully`,
      );
    } catch (error) {
      console.error('Registration error:', error);
      this.sendMessage(client, {
        type: 'registration-failed',
        error: 'Registration failed',
      });
    }
  }

  private async handleLockerStatusUpdate(
    client: WebSocket,
    data: {
      moduleId: string;
      lockerId: string;
      isOpen: boolean;
      timestamp?: number;
    },
  ) {
    console.log('Locker status update:', data);

    try {
      await this.setupService.updateLockerStatus(data.lockerId, data.isOpen);
      this.sendMessage(client, {
        type: 'status-update-ack',
        success: true,
        lockerId: data.lockerId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to update locker status:', error);
      this.sendMessage(client, {
        type: 'status-update-ack',
        success: false,
        error: 'Failed to update status',
        lockerId: data.lockerId,
      });
    }
  }

  private async handleModuleStatus(
    client: WebSocket,
    data: {
      moduleId: string;
      macAddress: string;
      status: any;
      timestamp?: number;
    },
  ) {
    console.log('Module status update:', data);

    this.sendMessage(client, {
      type: 'status-received',
      received: true,
      timestamp: Date.now(),
    });
  }

  private async handlePing(
    client: WebSocket,
    data: { moduleId?: string; timestamp?: number },
  ) {
    this.sendMessage(client, {
      type: 'pong',
      timestamp: Date.now(),
    });
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
      return true;
    } else {
      console.log(`Module ${moduleId} not connected or not ready`);
      return false;
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
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message to client:', error);
      }
    }
  }
}
