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

    const updatedLockerDto = {
      lockerId: updatedLocker.id,
      macAddress: toggleLockDto.macAddress,
      isOpen: updatedLocker.isOpen,
    };

    this.moduleGateway.handleToggleLock(updatedLockerDto);
  }
}
