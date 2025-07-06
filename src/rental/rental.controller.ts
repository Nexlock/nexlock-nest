import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RentalService } from './rental.service';
import { JwtUserAuthGuard } from 'src/user/guards/jwt-user-auth.guard';
import { JwtAdminAuthGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { ModuleService } from 'src/module/module.service';

@Controller('rental')
export class RentalController {
  constructor(
    private rentalService: RentalService,
    private moduleService: ModuleService,
  ) {}

  @UseGuards(JwtAdminAuthGuard)
  @Post('checkout/force/:lockerId')
  async forceCheckoutLocker(@Param('lockerId') lockerId: string) {
    return this.rentalService.forceCheckoutLocker(lockerId);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('locker-all/:lockerId')
  async getAllRentalsByLocker(@Param('lockerId') lockerId: string) {
    return this.rentalService.getAllActiveRentalsByLockerId(lockerId);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('module-all/:moduleId')
  async getAllRentalsByModule(@Param('moduleId') moduleId: string) {
    return this.rentalService.getAllActiveRentalsByModuleId(moduleId);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('history/:lockerId')
  async getRentalHistoryByLockerId(
    @Param('lockerId') lockerId: string,
    @Query('limit') limit: string,
  ) {
    const limitNumber = parseInt(limit, 10) || 5;
    return this.rentalService.getRentalHistoryByLockerId(lockerId, limitNumber);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('locker/:lockerId')
  async getRentalsByLocker(@Param('lockerId') lockerId: string) {
    return this.rentalService.getActiveRentalsByLockerId(lockerId);
  }

  @UseGuards(JwtAdminAuthGuard)
  @Get('module/:moduleId')
  async getRentalsByModule(@Param('moduleId') moduleId: string) {
    return this.rentalService.getActiveRentalsByModuleId(moduleId);
  }

  @UseGuards(JwtUserAuthGuard)
  @Get('user')
  async getAllRentals(@Request() req: any) {
    const userId = req.user.id;
    return this.rentalService.getRentalHistory(userId);
  }

  @UseGuards(JwtUserAuthGuard)
  @Post('checkout/:lockerId')
  async checkoutLocker(
    @Param('lockerId') lockerId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.rentalService.checkoutLocker(userId, lockerId);
  }

  @UseGuards(JwtUserAuthGuard)
  @Post('rent/:lockerId')
  async rentLocker(@Param('lockerId') lockerId: string, @Request() req: any) {
    const userId = req.user.id;
    return this.rentalService.rentLocker(lockerId, userId);
  }

  @UseGuards(JwtUserAuthGuard)
  @Get('active')
  async getActiveRentals(@Request() req: any) {
    const userId = req.user.id;
    return this.rentalService.getActiveRentalsByUserId(userId);
  }

  @UseGuards(JwtUserAuthGuard)
  @Get(':rentalId')
  async getRentalById(
    @Param('rentalId') rentalId: string,
    @Request() req: any,
  ) {
    return this.rentalService.getRentalById(rentalId);
  }
}
