import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AppService {
  getMainPage() {
    return new NotFoundException();
  }
}
