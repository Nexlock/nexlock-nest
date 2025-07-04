import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SetupService } from '../setup/setup.service';
import { JwtAdminAuthGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { ModuleService } from './module.service';
import { JwtUserAuthGuard } from 'src/user/guards/jwt-user-auth.guard';

@Controller('module')
export class ModuleController {
  constructor(
    private setupService: SetupService,
    private moduleService: ModuleService,
  ) {}

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
}
