import { UnauthorizedException } from '@nestjs/common';
import { InvalidCredentialsException } from 'src/common';

export class InvalidOtpException extends UnauthorizedException {
  constructor() {
    super('Invalid or expired OTP');
  }
}
