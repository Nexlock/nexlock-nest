import { Module, forwardRef } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { AdminAuthService } from 'src/admin-auth/admin-auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminAuthModule } from 'src/admin-auth/admin-auth.module';
import { JwtService } from '@nestjs/jwt';
import { ModuleModule } from 'src/module/module.module';

@Module({
  imports: [PrismaModule, AdminAuthModule, forwardRef(() => ModuleModule)],
  controllers: [SetupController],
  providers: [SetupService, AdminAuthService, JwtService],
  exports: [SetupService],
})
export class SetupModule {}
