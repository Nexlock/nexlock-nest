import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SetupService } from './setup.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { JwtAdminAuthGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { RegisterModuleToAdminDto } from './dto/register-module-to-admin.dto';
import { FindModuleByMacAddressDto } from './dto/find-module-by-mac-address.dto';

@Controller('setup')
export class SetupController {
  constructor(private setupService: SetupService) {}

  @Post('create-module')
  @UseGuards(JwtAdminAuthGuard)
  async createModule(@Body() createModuleDto: CreateModuleDto) {
    return this.setupService.createModule(createModuleDto);
  }

  @Post('register-module-to-admin')
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
  async checkModuleStatus(@Param('macAddress') macAddress: string) {
    try {
      const result =
        await this.setupService.checkModuleRegistration(macAddress);
      return {
        exists: result.exists,
        isRegistered: result.isRegistered,
        moduleId: result.moduleId,
      };
    } catch (error) {
      return {
        exists: false,
        isRegistered: false,
        moduleId: null,
      };
    }
  }

  @Post('initialize/:macAddress')
  @HttpCode(HttpStatus.OK)
  async initializeModule(@Param('macAddress') macAddress: string) {
    try {
      console.log(`Initializing module with MAC: ${macAddress}`);

      // Find or create module
      const module =
        await this.setupService.findOrCreateModuleByMacAddress(macAddress);

      if (!module) {
        console.error(`Module with MAC ${macAddress} not found or created.`);
        throw new NotFoundException(
          `Module with MAC address ${macAddress} not found.`,
        );
      }

      // Generate OTP
      const oneTimePassword =
        await this.setupService.generateOtpForModule(macAddress);

      console.log(
        `Generated OTP for module ${macAddress}: ${oneTimePassword.otp}`,
      );

      return {
        otp: oneTimePassword.otp,
        module: {
          id: module.id,
          macAddress: module.macAddress,
        },
        lockers: module.lockers.map((locker) => ({
          id: locker.id,
          isOpen: locker.isOpen,
        })),
      };
    } catch (error) {
      console.error('Failed to initialize module:', error);
      throw error;
    }
  }
}
