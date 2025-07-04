import { Module } from '@nestjs/common';
import { ModuleGateway } from './module.gateway';
import { ModuleService } from './module.service';
import { ModuleController } from './module.controller';
import { SetupModule } from 'src/setup/setup.module';
import { SetupService } from 'src/setup/setup.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [SetupModule, PrismaModule],
  providers: [ModuleGateway, ModuleService, SetupService],
  controllers: [ModuleController],
  exports: [ModuleGateway],
})
export class ModuleModule {}
