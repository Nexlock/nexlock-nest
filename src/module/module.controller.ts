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
import {
  ToggleLockEventDto,
  ToggleLockEventForUserDto,
} from './dto/toggle-lock-event.dto';
import { ModuleGateway } from './module.gateway';
import { SearchByLocationDto } from './dto/search-by-location.dto';

@Controller('module')
export class ModuleController {
  constructor(
    @Inject(forwardRef(() => SetupService))
    private setupService: SetupService,
    private moduleService: ModuleService,
  ) {}

  @Post('setup/:moduleId')
  @UseGuards(JwtAdminAuthGuard)
  async setupModule(
    @Param('moduleId') moduleId: string,
    @Body() setupModuleInfoDto: SetupModuleInfoDto,
  ) {
    return this.moduleService.setupModuleInfo(moduleId, setupModuleInfoDto);
  }

  // Can be used by user or admin
  @Get('status/:macAddress')
  async getStatus(@Param('macAddress') macAddress: string) {
    return this.moduleService.getStatus(macAddress);
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

  @UseGuards(JwtUserAuthGuard)
  @Get('locker/:lockerId')
  async getLockerById(@Param('lockerId') lockerId: string) {
    return this.moduleService.getLockerById(lockerId);
  }

  @Post('toggle-lock')
  @UseGuards(JwtAdminAuthGuard)
  async toggleLock(
    @Request() req: any,
    @Body() toggleLockEventDto: ToggleLockEventDto,
  ) {
    const adminId = req.user.id;
    return this.moduleService.toggleLockEvent(adminId, toggleLockEventDto);
  }

  @Post('toggle-lock/user')
  @UseGuards(JwtUserAuthGuard)
  async toggleLockForUser(
    @Request() req: any,
    @Body() toggleLockEventForUser: ToggleLockEventForUserDto,
  ) {
    const userId = req.user.id;
    return this.moduleService.toggleLockEventForUser(
      userId,
      toggleLockEventForUser,
    );
  }

  @UseGuards(JwtUserAuthGuard)
  @Get('user/:moduleId')
  async getModuleForUser(@Param('moduleId') moduleId: string) {
    return this.moduleService.getModuleById(moduleId);
  }

  @Get('connection-status/:moduleId')
  @UseGuards(JwtAdminAuthGuard)
  async getConnectionStatus(@Param('moduleId') moduleId: string) {
    return this.moduleService.getConnectionStatus(moduleId);
  }

  @Post('search')
  @UseGuards(JwtUserAuthGuard)
  async searchModules(@Body() searchByLocationDto: SearchByLocationDto) {
    return this.moduleService.browseModulesByLocation(
      searchByLocationDto.latitude,
      searchByLocationDto.longitude,
      searchByLocationDto.radius,
    );
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get(':moduleId')
  async getModule(@Param('moduleId') moduleId: string) {
    return this.moduleService.getModuleById(moduleId);
  }
}
