import { Controller, Get, Param } from '@nestjs/common';
import { SetupService } from '../setup/setup.service';

@Controller('module')
export class ModuleController {
  constructor(private setupService: SetupService) {}

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
}
