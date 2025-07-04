import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) {}
  async getModuleStatus(macAddress: string) {
    const module = await this.prisma.module.findUnique({
      where: {
        macAddress,
      },
    });

    return module;
  }

  async getModulesByAdminId(adminId: string) {
    const modules = await this.prisma.module.findMany({
      where: {
        adminId,
      },
      include: {
        lockers: true,
      },
    });

    if (!modules || modules.length === 0) {
      return [];
    }

    return modules;
  }

  async getModuleById(moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: {
        id: moduleId,
      },
      include: {
        lockers: true,
      },
    });

    if (!module) {
      return null;
    }

    return module;
  }

  async browseModulesForUser(page: number = 1) {
    const skip = (page - 1) * 10;
    const modules = await this.prisma.module.findMany({
      take: 10,
      skip: skip,
    });

    return modules;
  }
}
