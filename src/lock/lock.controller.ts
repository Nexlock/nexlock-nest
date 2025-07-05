import { Body, Controller, Post } from '@nestjs/common';
import { ToggleLockDto } from './dto/toggle-lock.dto';
import { LockService } from './lock.service';

@Controller('lock')
export class LockController {
  constructor(private lockService: LockService) {}

  @Post('toggle')
  async toggleLock(@Body() toggleLockDto: ToggleLockDto) {
    const updatedLocker = await this.lockService.toggleLock(toggleLockDto);

    return {
      success: true,
      locker: updatedLocker,
      action: updatedLocker.isOpen ? 'unlocked' : 'locked',
    };
  }

  @Post('lock')
  async lockLocker(@Body() { lockerId }: { lockerId: string }) {
    const locker = await this.lockService.lockLocker(lockerId);

    return {
      success: true,
      locker,
      action: 'locked',
    };
  }

  @Post('unlock')
  async unlockLocker(@Body() { lockerId }: { lockerId: string }) {
    const locker = await this.lockService.unlockLocker(lockerId);

    return {
      success: true,
      locker,
      action: 'unlocked',
    };
  }
}
