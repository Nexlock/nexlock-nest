import { Body, Controller, Post } from '@nestjs/common';
import { ModuleGateway } from 'src/module/module.gateway';
import { ToggleLockDto } from './dto/toggle-lock.dto';
import { LockService } from './lock.service';

@Controller('lock')
export class LockController {
  constructor(
    private moduleGateway: ModuleGateway,
    private lockService: LockService,
  ) {}

  @Post('toggle')
  async toggleLock(@Body() toggleLockDto: ToggleLockDto) {
    const updatedLocker = await this.lockService.toggleLock(toggleLockDto);

    // Send lock/unlock command to the connected module
    this.moduleGateway.sendLockCommand(
      updatedLocker.moduleId,
      updatedLocker.id,
      !updatedLocker.isOpen, // Send lock command if locker should be locked (isOpen = false)
    );

    return {
      success: true,
      locker: updatedLocker,
      action: updatedLocker.isOpen ? 'unlocked' : 'locked',
    };
  }

  @Post('lock')
  async lockLocker(@Body() { lockerId }: { lockerId: string }) {
    const locker = await this.lockService.lockLocker(lockerId);

    // Send lock command to the connected module
    this.moduleGateway.sendLockCommand(locker.moduleId, locker.id, true); // Lock the locker

    return {
      success: true,
      locker,
      action: 'locked',
    };
  }

  @Post('unlock')
  async unlockLocker(@Body() { lockerId }: { lockerId: string }) {
    const locker = await this.lockService.unlockLocker(lockerId);

    // Send unlock command to the connected module
    this.moduleGateway.sendLockCommand(locker.moduleId, locker.id, false); // Unlock the locker

    return {
      success: true,
      locker,
      action: 'unlocked',
    };
  }
}
