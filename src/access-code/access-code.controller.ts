import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { VerifyQrCodeDto } from './dto/verify-qr-code.dto';
import { AccessCodeService } from './access-code.service';
import { CreateQrCodeDto } from './dto/create-qr-code.dto';
import { JwtUserAuthGuard } from 'src/user/guards/jwt-user-auth.guard';

@Controller('access-code')
export class AccessCodeController {
  constructor(private accessCodeService: AccessCodeService) {}

  @Post('verify')
  async verifyQrCode(@Body() verifyQrCodeDto: VerifyQrCodeDto) {
    return this.accessCodeService.verifyQrCode(verifyQrCodeDto);
  }

  @Post('create')
  @UseGuards(JwtUserAuthGuard)
  async createQrCode(
    @Request() req: any,
    @Body() createQrCodeDto: CreateQrCodeDto,
  ) {
    const userId = req.user.id;
    return this.accessCodeService.createQrCode(userId, createQrCodeDto);
  }
}
