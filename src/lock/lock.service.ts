import { Injectable } from '@nestjs/common';
import { ToggleLockDto } from './dto/toggle-lock.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LockService {
  constructor(private prisma: PrismaService) {}

  /**
   * Toggles the lock state of a locker.
   * @param toggleLockDto - DTO containing the locker ID.
   * @returns The updated locker state.
   */
  async toggleLock(toggleLockDto: ToggleLockDto) {
    const { lockerId } = toggleLockDto;

    const locker = await this.prisma.locker.findUnique({
      where: { id: lockerId },
    });

    if (!locker) {
      throw new Error('Locker not found');
    }

    const updatedLocker = await this.prisma.locker.update({
      where: { id: lockerId },
      data: { isOpen: !locker.isOpen },
    });

    return updatedLocker;
  }
}
