import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UserNotFoundException,
} from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';
import { Admin } from 'generated/prisma';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async verifyAdminEmail(email: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return new UserNotFoundException();
    }

    return admin;
  }

  async validateAdmin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !admin.password) {
      return new UserNotFoundException();
    }

    const validPassword = await argon2.verify(admin.password, password);

    if (!validPassword) {
      return new InvalidCredentialsException();
    }

    return admin;
  }

  async login(admin: Admin) {
    const payload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerAdminDto: RegisterAdminDto) {
    const { email, password, name } = registerAdminDto;
    const existingAdmin = await this.verifyAdminEmail(email);

    if (existingAdmin) {
      throw new EmailAlreadyExistsException();
    }

    const hashedPassword = await argon2.hash(password);

    const admin = await this.prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    if (!admin) {
      throw new InternalServerErrorException();
    }

    return this.login(admin);
  }
}
