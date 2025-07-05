import { Module, forwardRef } from '@nestjs/common';
import { ModuleService } from './module.service';
import { ModuleController } from './module.controller';
import { SetupModule } from 'src/setup/setup.module';
import { ModuleGateway } from './module.gateway';

@Module({
  imports: [forwardRef(() => SetupModule)],
  providers: [ModuleService, ModuleGateway],
  controllers: [ModuleController],
  exports: [ModuleGateway],
})
export class ModuleModule {}
