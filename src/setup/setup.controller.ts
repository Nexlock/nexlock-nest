import {
  Body,
  Controller,
  Get,
  NotFoundException,
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

  @Get('otp/:macAddress')
  async generateOtpForModule(@Param('macAddress') macAddress: string) {
    return this.setupService.generateOtpForModule(macAddress);
  }

  @Get('module/:address')
  async getModule(@Param('address') address: string) {
    const findModuleByMacAddressDto: FindModuleByMacAddressDto = {
      macAddress: address,
    };
    return this.setupService.findModuleByMacAddress(findModuleByMacAddressDto);
  }

  @Get('check/:macAddress')
  async checkModuleSetup(@Param('macAddress') macAddress: string) {
    return this.setupService.checkModuleRegistration(macAddress);
  }

  @Post('initialize/:macAddress')
  async initializeModule(@Param('macAddress') macAddress: string) {
    const module =
      await this.setupService.findOrCreateModuleByMacAddress(macAddress);

    if (!module) {
      throw new NotFoundException();
    }

    const otp = await this.setupService.generateOtpForModule(macAddress);

    return {
      module,
      otp: otp.otp,
      lockers: module.lockers,
    };
  }
}
