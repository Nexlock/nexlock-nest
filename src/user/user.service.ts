import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User } from 'generated/prisma';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UserNotFoundException,
} from 'src/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async verifyUserEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new UserNotFoundException();
    }

    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new UserNotFoundException();
    }

    const validPassword = await argon2.verify(user.password, password);

    if (!validPassword) {
      return new InvalidCredentialsException();
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerUserDto: RegisterUserDto) {
    const { email, password, name } = registerUserDto;
    const existingUser = await this.verifyUserEmail(email);

    if (existingUser) {
      throw new EmailAlreadyExistsException();
    }

    const hashedPassword = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return this.login(user);
  }
}
