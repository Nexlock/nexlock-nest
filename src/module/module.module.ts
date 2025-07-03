import { Module } from '@nestjs/common';
import { ModuleGateway } from './module.gateway';
import { ModuleService } from './module.service';
import { ModuleController } from './module.controller';

@Module({
  providers: [ModuleGateway, ModuleService],
  controllers: [ModuleController]
})
export class ModuleModule {}
