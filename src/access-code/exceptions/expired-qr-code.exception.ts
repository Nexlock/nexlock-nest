import { BadRequestException } from '@nestjs/common';

export class ExpiredQrCodeException extends BadRequestException {
  constructor() {
    super('QR code has expired');
  }
}
