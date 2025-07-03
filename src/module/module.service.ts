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
}
