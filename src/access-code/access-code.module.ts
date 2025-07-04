import { Module } from '@nestjs/common';
import { AccessCodeController } from './access-code.controller';
import { AccessCodeService } from './access-code.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminAuthModule } from 'src/admin-auth/admin-auth.module';
import { AdminAuthService } from 'src/admin-auth/admin-auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [PrismaModule, AdminAuthModule, UserModule],
  controllers: [AccessCodeController],
  providers: [AccessCodeService, AdminAuthService, JwtService, UserService],
})
export class AccessCodeModule {}
