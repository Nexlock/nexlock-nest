import { UnauthorizedException } from '@nestjs/common';

export class InvalidQrException extends UnauthorizedException {
  constructor() {
    super('Invalid QR code');
  }
}
