import { Test, TestingModule } from '@nestjs/testing';
import { AccessCodeService } from './access-code.service';

describe('AccessCodeService', () => {
  let service: AccessCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessCodeService],
    }).compile();

    service = module.get<AccessCodeService>(AccessCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
