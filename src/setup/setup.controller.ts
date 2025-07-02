import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SetupService } from './setup.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { JwtAdminAuthGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { RegisterModuleToAdminDto } from './dto/register-module-to-admin.dto';
import { FindModuleByMacAddressDto } from './dto/find-module-by-mac-address.dto';

@Controller('setup')
export class SetupController {
  constructor(private setupService: SetupService) {}

  @Post('create')
  async createModule(@Body() createModuleDto: CreateModuleDto) {
    return this.setupService.createModule(createModuleDto);
  }

  @Post('register')
  @UseGuards(JwtAdminAuthGuard)
  async registerModuleToAdmin(
    @Request() req: any,
    @Body() registerModuleToAdminDto: RegisterModuleToAdminDto,
  ) {
    const adminId = req.user.id;
    return this.setupService.registerModuleToAdmin(
      adminId,
      registerModuleToAdminDto,
    );
  }

  @Get('module/:address')
  async getModule(@Param('address') address: string) {
    const findModuleByMacAddressDto: FindModuleByMacAddressDto = {
      macAddress: address,
    };
    return this.setupService.findModuleByMacAddress(findModuleByMacAddressDto);
  }
}
