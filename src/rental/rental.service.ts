import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { LockService } from 'src/lock/lock.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RentalService {
  constructor(
    private lockService: LockService,
    private prisma: PrismaService,
  ) {}

  async rentLocker(lockerId: string, userId: string) {
    const locker = await this.prisma.locker.findUnique({
      where: { id: lockerId },
      include: { module: true },
    });

    if (!locker) {
      throw new NotFoundException();
    }

    const rental = await this.prisma.lockerRental.create({
      data: {
        user: {
          connect: { id: userId },
        },
        locker: {
          connect: { id: lockerId },
        },
      },
    });

    if (!rental) {
      throw new InternalServerErrorException();
    }

    this.lockService.lockLocker(lockerId);

    return rental;
  }

  async checkoutLocker(userId: string, lockerId: string) {
    const rental = await this.prisma.lockerRental.findFirst({
      where: {
        userId,
        lockerId,
        endTime: null,
      },
    });

    if (!rental) {
      throw new Error('No active rental found');
    }

    rental.endTime = new Date();
    await this.prisma.lockerRental.update({
      where: { id: rental.id },
      data: { endTime: rental.endTime },
    });

    this.lockService.unlockLocker(lockerId);

    return rental;
  }

  async forceCheckoutLocker(lockerId: string) {
    const rental = await this.prisma.lockerRental.findFirst({
      where: {
        lockerId,
        endTime: null,
      },
    });

    if (!rental) {
      throw new NotFoundException('No active rental found for this locker');
    }

    rental.endTime = new Date();
    await this.prisma.lockerRental.update({
      where: { id: rental.id },
      data: { endTime: rental.endTime },
    });

    this.lockService.unlockLocker(lockerId);

    return rental;
  }

  async getRentalHistory(userId: string) {
    const rentals = await this.prisma.lockerRental.findMany({
      where: { userId },
      include: { locker: true },
    });
    return rentals;
  }

  async getRentalById(rentalId: string) {
    const rental = await this.prisma.lockerRental.findUnique({
      where: { id: rentalId },
      include: { locker: true },
    });
    return rental;
  }

  async getActiveRentalsByUserId(userId: string) {
    const rentals = await this.prisma.lockerRental.findMany({
      where: { userId, endTime: null },
      include: { locker: true },
    });
    return rentals;
  }

  async getActiveRentalsByLockerId(lockerId: string) {
    const rentals = await this.prisma.lockerRental.findMany({
      where: { lockerId, endTime: null },
      include: { user: true },
    });
    return rentals;
  }

  async getActiveRentalsByModuleId(moduleId: string) {
    const rentals = await this.prisma.lockerRental.findMany({
      where: { locker: { moduleId }, endTime: null },
      include: { user: true, locker: true },
    });
    return rentals;
  }

  async getAllActiveRentalsByModuleId(moduleId: string) {
    const rentals = await this.prisma.lockerRental.findMany({
      where: { locker: { moduleId }, endTime: null },
      include: { user: true, locker: true },
    });
    return rentals;
  }

  async getAllActiveRentalsByLockerId(lockerId: string) {
    const rentals = await this.prisma.lockerRental.findMany({
      where: { lockerId, endTime: null },
      include: { user: true },
    });
    return rentals;
  }
}
