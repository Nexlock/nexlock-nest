import { Injectable, NotFoundException } from '@nestjs/common';
import { ToggleLockDto } from './dto/toggle-lock.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ModuleGateway } from 'src/module/module.gateway';

@Injectable()
export class LockService {
  constructor(
    private prisma: PrismaService,
    private moduleGateway: ModuleGateway,
  ) {}

  /**
   * Toggles the lock state of a locker.
   * @param toggleLockDto - DTO containing the locker ID.
   * @returns The updated locker state.
   */
  async toggleLock(toggleLockDto: ToggleLockDto) {
    const { lockerId } = toggleLockDto;

    const locker = await this.prisma.locker.findUnique({
      where: { id: lockerId },
      include: { module: true },
    });

    if (!locker) {
      throw new NotFoundException('Locker not found');
    }

    const updatedLocker = await this.prisma.locker.update({
      where: { id: lockerId },
      data: { isOpen: !locker.isOpen },
      include: { module: true },
    });

    // Send lock/unlock command to the connected module
    this.moduleGateway.sendLockCommand(
      updatedLocker.moduleId,
      updatedLocker.id,
      !updatedLocker.isOpen, // Send lock command if locker should be locked (isOpen = false)
    );

    return updatedLocker;
  }

  /**
   * Locks a specific locker.
   * @param lockerId - The ID of the locker to lock.
   * @returns The updated locker state.
   */
  async lockLocker(lockerId: string) {
    const locker = await this.prisma.locker.findUnique({
      where: { id: lockerId },
      include: { module: true },
    });

    if (!locker) {
      throw new NotFoundException('Locker not found');
    }

    const updatedLocker = await this.prisma.locker.update({
      where: { id: lockerId },
      data: { isOpen: false },
      include: { module: true },
    });

    // Send lock command to the connected module
    this.moduleGateway.sendLockCommand(
      updatedLocker.moduleId,
      updatedLocker.id,
      true,
    );

    return updatedLocker;
  }

  /**
   * Unlocks a specific locker.
   * @param lockerId - The ID of the locker to unlock.
   * @returns The updated locker state.
   */
  async unlockLocker(lockerId: string) {
    const locker = await this.prisma.locker.findUnique({
      where: { id: lockerId },
      include: { module: true },
    });

    if (!locker) {
      throw new NotFoundException('Locker not found');
    }

    const updatedLocker = await this.prisma.locker.update({
      where: { id: lockerId },
      data: { isOpen: true },
      include: { module: true },
    });

    // Send unlock command to the connected module
    this.moduleGateway.sendLockCommand(
      updatedLocker.moduleId,
      updatedLocker.id,
      false,
    );

    return updatedLocker;
  }

  /**
   * Get the current status of a locker.
   * @param lockerId - The ID of the locker.
   * @returns The locker with its current status.
   */
  async getLockerStatus(lockerId: string) {
    const locker = await this.prisma.locker.findUnique({
      where: { id: lockerId },
      include: { module: true },
    });

    if (!locker) {
      throw new NotFoundException('Locker not found');
    }

    return locker;
  }

  /**
   * Get all lockers for a specific module.
   * @param moduleId - The ID of the module.
   * @returns Array of lockers belonging to the module.
   */
  async getModuleLockers(moduleId: string) {
    return await this.prisma.locker.findMany({
      where: { moduleId },
      include: { module: true },
    });
  }
}
