import { Module } from '@nestjs/common';
import { LockController } from './lock.controller';
import { LockService } from './lock.service';
import { ModuleModule } from 'src/module/module.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ModuleModule, PrismaModule],
  controllers: [LockController],
  providers: [LockService],
})
export class LockModule {}
