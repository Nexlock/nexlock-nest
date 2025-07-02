import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { RegisterModuleToAdminDto } from './dto/register-module-to-admin.dto';
import { InvalidOtpException } from './exceptions/invalid-otp.exception';
import { FindModuleByMacAddressDto } from './dto/find-module-by-mac-address.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class SetupService {
  constructor(private prisma: PrismaService) {}
  async createModule(createModuleDto: CreateModuleDto) {
    const { macAddress, lockerCount } = createModuleDto;

    const module = await this.prisma.module.create({
      data: {
        macAddress,
      },
    });

    const lockerIds: string[] = [];
    for (let i = 0; i < lockerCount; i++) {
      const lockerId = nanoid(16);
      lockerIds.push(lockerId);
      await this.prisma.locker.create({
        data: {
          id: lockerId,
          module: {
            connect: {
              id: module.id,
            },
          },
        },
      });
    }

    return lockerIds;
  }

  async registerModuleToAdmin(
    adminId: string,
    registerModuleToAdminDto: RegisterModuleToAdminDto,
  ) {
    const { otp } = registerModuleToAdminDto;

    const oneTimePassword = await this.prisma.oneTimePassword.findFirst({
      where: {
        otp,
        isUsed: false,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        module: true,
      },
    });

    if (!oneTimePassword) {
      throw new InvalidOtpException();
    }

    const updatedModule = await this.prisma.module.update({
      where: {
        id: oneTimePassword.module.id,
      },
      data: {
        admin: {
          connect: {
            id: adminId,
          },
        },
        oneTimePassword: {
          update: {
            where: {
              id: oneTimePassword.id,
            },
            data: {
              admin: {
                connect: {
                  id: adminId,
                },
              },
              isUsed: true,
            },
          },
        },
      },
    });

    if (!updatedModule) {
      throw new InternalServerErrorException();
    }

    return updatedModule;
  }

  async findModuleByMacAddress(
    findModuleByMacAddressDto: FindModuleByMacAddressDto,
  ) {
    const { macAddress } = findModuleByMacAddressDto;

    const module = await this.prisma.module.findUnique({
      where: {
        macAddress,
      },
    });

    if (!module) {
      throw new InternalServerErrorException('Module not found');
    }

    return module;
  }
}
