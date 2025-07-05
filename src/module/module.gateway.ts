import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { SetupService } from '../setup/setup.service';
import { Module } from '@prisma/client';

@WebSocketGateway({
  path: '/ws',
})
export class ModuleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedModules = new Map<string, WebSocket>();
  private pendingModules = new Map<string, WebSocket>(); // MAC -> WebSocket

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

    // Remove from pending modules
    for (const [macAddress, socket] of this.pendingModules.entries()) {
      if (socket === client) {
        this.pendingModules.delete(macAddress);
        console.log(`Pending module with MAC ${macAddress} disconnected`);
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
      case 'module-connect':
        await this.handleModuleConnect(client, message);
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

  private async handleModuleConnect(
    client: WebSocket,
    data: { macAddress: string },
  ) {
    console.log('Module connection attempt:', data);
    const { macAddress } = data;

    if (!macAddress) {
      this.sendMessage(client, {
        type: 'connection-failed',
        error: 'MAC address is required',
      });
      return;
    }

    try {
      const module = await this.setupService.findModuleByMacAddress(data);

      if (module && module.adminId) {
        // Module is already registered, treat as a normal connection
        this.connectedModules.set(module.id, client);
        this.sendMessage(client, {
          type: 'module-registered',
          moduleId: module.id,
          message: 'Module reconnected successfully',
        });
        console.log(`Module ${module.id} reconnected.`);
      } else {
        // Module is not registered yet, keep it in a pending state
        this.pendingModules.set(macAddress, client);
        this.sendMessage(client, {
          type: 'connection-acknowledged',
          message: 'Awaiting registration via admin panel',
        });
        console.log(`Module with MAC ${macAddress} is pending registration.`);
      }
    } catch (error) {
      // Module does not exist in DB yet, also pending
      this.pendingModules.set(macAddress, client);
      this.sendMessage(client, {
        type: 'connection-acknowledged',
        message: 'Awaiting registration via admin panel',
      });
      console.log(
        `Module with MAC ${macAddress} is pending registration (not in DB).`,
      );
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

  // Method to be called by SetupService after successful registration
  notifyModuleRegistered(module: Module) {
    const client = this.pendingModules.get(module.macAddress);
    if (client && client.readyState === WebSocket.OPEN) {
      // Move from pending to connected
      this.pendingModules.delete(module.macAddress);
      this.connectedModules.set(module.id, client);

      // Send success response to ESP32
      this.sendMessage(client, {
        type: 'module-registered',
        moduleId: module.id,
        macAddress: module.macAddress,
        message: 'Module registered successfully',
      });

      console.log(`Notified module ${module.id} of successful registration.`);
      return true;
    } else {
      console.warn(
        `Could not notify module with MAC ${module.macAddress}, it might be disconnected.`,
      );
      return false;
    }
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
