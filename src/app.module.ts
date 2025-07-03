import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { SetupModule } from './setup/setup.module';
import { AccessCodeModule } from './access-code/access-code.module';
import { ModuleModule } from './module/module.module';
import { LockModule } from './lock/lock.module';

@Module({
  imports: [PrismaModule, UserModule, AdminAuthModule, SetupModule, AccessCodeModule, ModuleModule, LockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
