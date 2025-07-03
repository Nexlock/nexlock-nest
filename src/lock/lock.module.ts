import { Module } from '@nestjs/common';
import { LockController } from './lock.controller';
import { LockService } from './lock.service';
import { ModuleGateway } from 'src/module/module.gateway';
import { ModuleModule } from 'src/module/module.module';

@Module({
  imports: [ModuleModule],
  controllers: [LockController],
  providers: [LockService, ModuleGateway],
})
export class LockModule {}
