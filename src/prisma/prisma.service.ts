import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class PrismaService {
  private static instance: PrismaClient | null;

  constructor() {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient();
    }
  }

  get prisma(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient();
    }
    return PrismaService.instance;
  }

  async onModuleDestroy() {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      PrismaService.instance = null;
    }
  }
}
