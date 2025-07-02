import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { SetupModule } from './setup/setup.module';

@Module({
  imports: [PrismaModule, UserModule, AdminAuthModule, SetupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
