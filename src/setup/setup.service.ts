import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { RegisterModuleToAdminDto } from './dto/register-module-to-admin.dto';
import { InvalidOtpException } from './exceptions/invalid-otp.exception';
import { FindModuleByMacAddressDto } from './dto/find-module-by-mac-address.dto';
import { nanoid } from 'nanoid';
import otpGenerator from 'otp-generator';

@Injectable()
export class SetupService {
  constructor(private prisma: PrismaService) {}
  async generateOtpForModule(macAddress: string) {
    const possibleExistingOtp = await this.prisma.oneTimePassword.findFirst({
      where: {
        module: {
          macAddress,
        },
        isUsed: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (possibleExistingOtp) {
      return possibleExistingOtp;
    }

    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });

    const oneTimePassword = await this.prisma.oneTimePassword.create({
      data: {
        otp,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // OTP valid for 15 minutes
        module: {
          connectOrCreate: {
            where: { macAddress },
            create: { macAddress },
          },
        },
      },
    });

    return oneTimePassword;
  }
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
      include: {
        lockers: true,
      },
    });

    if (!module) {
      throw new InternalServerErrorException('Module not found');
    }

    return module;
  }

  async findValidOtp(otp: string, macAddress: string) {
    return await this.prisma.oneTimePassword.findFirst({
      where: {
        otp,
        isUsed: false,
        expiresAt: {
          gte: new Date(),
        },
        module: {
          macAddress,
        },
      },
      include: {
        module: {
          include: {
            lockers: true,
          },
        },
      },
    });
  }

  async markOtpAsUsed(otpId: string) {
    return await this.prisma.oneTimePassword.update({
      where: { id: otpId },
      data: { isUsed: true },
    });
  }

  async updateLockerStatus(lockerId: string, isOpen: boolean) {
    return await this.prisma.locker.update({
      where: { id: lockerId },
      data: { isOpen },
    });
  }

  async findOrCreateModuleByMacAddress(macAddress: string) {
    let module = await this.prisma.module.findUnique({
      where: { macAddress },
      include: { lockers: true },
    });

    if (!module) {
      // Create new module with default 3 lockers
      module = await this.prisma.module.create({
        data: {
          macAddress,
        },
        include: { lockers: true },
      });

      const lockerIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        // Default 3 lockers
        const lockerId = nanoid(16);
        lockerIds.push(lockerId);
        await this.prisma.locker.create({
          data: {
            id: lockerId,
            module: {
              connect: { id: module.id },
            },
          },
        });
      }

      // Refetch module with lockers
      module = await this.prisma.module.findUnique({
        where: { id: module.id },
        include: { lockers: true },
      });

      console.log(`Created new module ${macAddress} with lockers:`, lockerIds);
    }

    return module;
  }

  async checkModuleRegistration(macAddress: string) {
    const module = await this.prisma.module.findUnique({
      where: { macAddress },
      include: { admin: true },
    });

    return {
      exists: !!module,
      isRegistered: !!module?.admin,
      moduleId: module?.id || null,
    };
  }
}
