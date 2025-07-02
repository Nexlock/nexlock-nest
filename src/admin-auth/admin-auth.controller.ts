import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { ZodValidationPipe } from 'src/common';
import {
  RegisterAdminDto,
  registerAdminSchema,
} from './dto/register-admin.dto';
import { LocalAdminAuthGuard } from './guards/local-admin-auth.guard';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerAdminSchema))
  async register(@Body() registerAdminDto: RegisterAdminDto) {
    return this.adminAuthService.register(registerAdminDto);
  }

  @UseGuards(LocalAdminAuthGuard)
  @Post('login')
  async login(@Request() req: { user: any }) {
    return this.adminAuthService.login(req.user);
  }

  @Get('info')
  async getAdminInfo(@Request() req: { user: any }) {
    const user = req.user;
    return user;
  }
}
