import { Module, forwardRef } from '@nestjs/common';
import { ModuleGateway } from './module.gateway';
import { ModuleService } from './module.service';
import { ModuleController } from './module.controller';
import { SetupModule } from 'src/setup/setup.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminAuthModule } from 'src/admin-auth/admin-auth.module';
import { UserModule } from 'src/user/user.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    forwardRef(() => SetupModule),
    PrismaModule,
    AdminAuthModule,
    UserModule,
  ],
  providers: [ModuleGateway, ModuleService, JwtService],
  controllers: [ModuleController],
  exports: [ModuleGateway, ModuleService],
})
export class ModuleModule {}
