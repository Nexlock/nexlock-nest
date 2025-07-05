import {
  Body,
  Controller,
  Get,
  Inject,
  forwardRef,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SetupService } from '../setup/setup.service';
import { JwtAdminAuthGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { ModuleService } from './module.service';
import { JwtUserAuthGuard } from 'src/user/guards/jwt-user-auth.guard';
import { SetupModuleInfoDto } from './dto/setup-module-info.dto';
import { ToggleLockEventDto } from './dto/toggle-lock-event.dto';
import { ModuleGateway } from './module.gateway';

@Controller('module')
export class ModuleController {
  constructor(
    @Inject(forwardRef(() => SetupService))
    private setupService: SetupService,
    private moduleService: ModuleService,
    private moduleGateway: ModuleGateway,
  ) {}

  @Post('setup/:moduleId')
  @UseGuards(JwtAdminAuthGuard)
  async setupModule(
    @Param('moduleId') moduleId: string,
    @Body() setupModuleInfoDto: SetupModuleInfoDto,
  ) {
    return this.moduleService.setupModuleInfo(moduleId, setupModuleInfoDto);
  }

  @Get('status/:macAddress')
  async getStatus(@Param('macAddress') macAddress: string) {
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

  @Get('admin')
  @UseGuards(JwtAdminAuthGuard)
  async getModulesByAdminId(@Request() req: any) {
    const adminId = req.user.id;
    const modules = await this.moduleService.getModulesByAdminId(adminId);
    return modules;
  }

  @Get('user')
  @UseGuards(JwtUserAuthGuard)
  async getModulesForUser(@Request() req: any, @Query('page') page: string) {
    const pageNumber = parseInt(page, 10) || 1;

    const modules = await this.moduleService.browseModulesForUser(pageNumber);

    return {
      modules,
      page: pageNumber,
      total: modules.length,
    };
  }

  @Post('toggle-lock')
  @UseGuards(JwtAdminAuthGuard)
  async toggleLock(
    @Request() req: any,
    @Body() toggleLockEventDto: ToggleLockEventDto,
  ) {
    const adminId = req.user.id;

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
      console.error('Toggle lock error:', error);
      throw error;
    }
  }

  @Get('connection-status/:moduleId')
  @UseGuards(JwtAdminAuthGuard)
  async getConnectionStatus(@Param('moduleId') moduleId: string) {
    const isConnected = this.moduleGateway.isModuleConnected(moduleId);
    return {
      moduleId,
      isConnected,
      connectedModules: this.moduleGateway.getConnectedModules(),
    };
  }
}
