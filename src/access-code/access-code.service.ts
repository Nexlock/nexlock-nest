import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { VerifyQrCodeDto } from './dto/verify-qr-code.dto';
import { InvalidQrException } from './exceptions/invalid-qr.exception';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class AccessCodeService {
  constructor(private prisma: PrismaService) {}

  async verifyQrCode(verifyQrCodeDto: VerifyQrCodeDto) {
    const { qrCode } = verifyQrCodeDto;

    const accessQrCode = await this.prisma.accessQrCode.findUnique({
      where: { qrCode },
    });

    if (!accessQrCode) {
      return null;
    }

    return accessQrCode;
  }

  async createQrCode(userId: string, createQrCodeDto: CreateQrCodeDto) {
    const { lockerRentalId } = createQrCodeDto;

    const qrCode = nanoid(16);

    const accessQrCode = await this.prisma.accessQrCode.create({
      data: {
        qrCode,
        user: {
          connect: { id: userId },
        },
        lockerRental: {
          connect: { id: lockerRentalId },
        },
      },
    });

    return accessQrCode;
  }
}
