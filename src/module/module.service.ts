import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SetupModuleInfoDto } from './dto/setup-module-info.dto';
import {
  ToggleLockEventDto,
  ToggleLockEventForUserDto,
} from './dto/toggle-lock-event.dto';
import { ModuleGateway } from './module.gateway';
import { SetupService } from 'src/setup/setup.service';

@Injectable()
export class ModuleService {
  constructor(
    private prisma: PrismaService,
    private moduleGateway: ModuleGateway,
    private setupService: SetupService,
  ) {}
  async setupModuleInfo(
    moduleId: string,
    setupModuleInfoDto: SetupModuleInfoDto,
  ) {
    const module = await this.prisma.module.update({
      where: {
        id: moduleId,
      },
      data: {
        ...setupModuleInfoDto,
      },
    });

    return module;
  }

  async getStatus(macAddress: string) {
    try {
      const module = await this.setupService.findModuleByMacAddress({
        macAddress,
      });
      return {
        exists: true,
        isRegistered: !!module.adminId,
        lockers: module.lockers || [],
      };
    } catch (error) {
      return {
        exists: false,
        isRegistered: false,
        lockers: [],
      };
    }
  }

  async getConnectionStatus(moduleId: string) {
    const isConnected = this.moduleGateway.isModuleConnected(moduleId);
    return {
      moduleId,
      isConnected,
      connectedModules: this.moduleGateway.getConnectedModules(),
    };
  }

  async toggleLockEvent(
    adminId: string,
    toggleLockEventDto: ToggleLockEventDto,
  ) {
    try {
      // Find module by MAC address
      const module = await this.setupService.findModuleByMacAddress({
        macAddress: toggleLockEventDto.macAddress,
      });

      // Verify admin owns this module
      if (module.adminId !== adminId) {
        throw new BadRequestException('Module does not belong to this admin');
      }

      // Find the locker
      const locker = module.lockers.find(
        (l) => l.id === toggleLockEventDto.lockerId,
      );
      if (!locker) {
        throw new BadRequestException('Locker not found');
      }

      // Check if module is connected
      if (!this.moduleGateway.isModuleConnected(module.id)) {
        throw new BadRequestException('Module is not connected');
      }

      // Send command to module
      const shouldLock = !toggleLockEventDto.isOpen;
      const success = this.moduleGateway.sendLockCommand(
        module.id,
        toggleLockEventDto.lockerId,
        shouldLock,
      );

      if (!success) {
        throw new BadRequestException('Failed to send command to module');
      }

      return {
        success: true,
        message: `${shouldLock ? 'Lock' : 'Unlock'} command sent successfully`,
        lockerId: toggleLockEventDto.lockerId,
        requestedState: toggleLockEventDto.isOpen,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'An error occurred while toggling lock event',
      );
    }
  }

  async toggleLockEventForUser(
    userId: string,
    toggleLockEventDto: ToggleLockEventForUserDto,
  ) {
    try {
      // Find the locker
      const locker = await this.prisma.locker.findUnique({
        where: {
          id: toggleLockEventDto.lockerId,
        },
      });

      if (!locker) {
        throw new BadRequestException('Locker not found');
      }

      // Check if module is connected
      if (!this.moduleGateway.isModuleConnected(locker.moduleId)) {
        throw new BadRequestException('Module is not connected');
      }

      // Verify if user is renting this locker
      const rental = await this.prisma.lockerRental.findFirst({
        where: {
          lockerId: toggleLockEventDto.lockerId,
          userId,
          endTime: null, // Active rental
        },
      });

      if (!rental) {
        throw new BadRequestException(
          'You do not have an active rental for this locker',
        );
      }

      // Send command to module
      const shouldLock = !toggleLockEventDto.isOpen;
      const success = this.moduleGateway.sendLockCommand(
        locker.moduleId,
        toggleLockEventDto.lockerId,
        shouldLock,
      );

      if (!success) {
        throw new BadRequestException('Failed to send command to module');
      }

      return {
        success: true,
        message: `${shouldLock ? 'Lock' : 'Unlock'} command sent successfully`,
        lockerId: toggleLockEventDto.lockerId,
        requestedState: toggleLockEventDto.isOpen,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'An error occurred while toggling lock event',
      );
    }
  }

  async getModuleStatus(macAddress: string) {
    const module = await this.prisma.module.findUnique({
      where: {
        macAddress,
      },
    });

    return module;
  }

  async getModulesByAdminId(adminId: string) {
    const modules = await this.prisma.module.findMany({
      where: {
        adminId,
      },
      include: {
        lockers: true,
      },
    });

    if (!modules || modules.length === 0) {
      return [];
    }

    return modules;
  }

  async getModuleById(moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: {
        id: moduleId,
      },
      include: {
        lockers: true,
      },
    });

    if (!module) {
      return null;
    }

    return module;
  }

  async browseModulesForUser(page: number = 1) {
    const skip = (page - 1) * 10;
    const modules = await this.prisma.module.findMany({
      take: 10,
      skip: skip,
    });

    return modules;
  }

  async browseModulesByLocation(
    latitude: number,
    longitude: number,
    radius: number = 0.008983, // Default radius in degrees (approx. 1 km)
  ) {
    const modules = await this.prisma.module.findMany({
      where: {
        name: {
          not: null,
        },
        latitude: {
          gte: latitude - radius,
          lte: latitude + radius,
        },
        longitude: {
          gte: longitude - radius,
          lte: longitude + radius,
        },
      },
      include: {
        lockers: true,
      },
    });

    return modules;
  }
}
