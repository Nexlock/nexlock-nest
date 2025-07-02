import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AdminAuthService } from '../admin-auth.service';
import { InvalidCredentialsException } from 'src/common';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local-admin') {
  constructor(private adminAuthService: AdminAuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const admin = await this.adminAuthService.validateAdmin(email, password);

    if (!admin) {
      throw new InvalidCredentialsException();
    }

    return admin;
  }
}
