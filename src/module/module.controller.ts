import { Controller, Get, Param } from '@nestjs/common';

@Controller('module')
export class ModuleController {
  @Get('status/:macAddress')
  getStatus(@Param('macAddress') macAddress: string) {}
}
