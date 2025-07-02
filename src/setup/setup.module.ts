import { Module } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { AdminAuthService } from 'src/admin-auth/admin-auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminAuthModule } from 'src/admin-auth/admin-auth.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [SetupController],
  providers: [SetupService, AdminAuthService, JwtService],
})
export class SetupModule {}
