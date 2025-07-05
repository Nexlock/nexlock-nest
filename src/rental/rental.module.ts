import { Module } from '@nestjs/common';
import { RentalController } from './rental.controller';
import { RentalService } from './rental.service';
import { LockModule } from 'src/lock/lock.module';
import { JwtService } from '@nestjs/jwt';
import { LockService } from 'src/lock/lock.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ModuleModule } from 'src/module/module.module';
import { UserModule } from 'src/user/user.module';
import { AdminAuthModule } from 'src/admin-auth/admin-auth.module';

@Module({
  imports: [
    LockModule,
    PrismaModule,
    ModuleModule,
    UserModule,
    AdminAuthModule,
  ],
  controllers: [RentalController],
  providers: [RentalService, JwtService, LockService, PrismaService],
})
export class RentalModule {}
