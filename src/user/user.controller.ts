import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ZodValidationPipe } from 'src/common';
import { RegisterUserDto, registerUserSchema } from './dto/register-user.dto';
import { LocalUserAuthGuard } from './guards/local-user-auth.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerUserSchema))
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.register(registerUserDto);
  }

  @UseGuards(LocalUserAuthGuard)
  @Post('login')
  async login(@Request() req: { user: any }) {
    return this.userService.login(req.user);
  }
}
