import { Test, TestingModule } from '@nestjs/testing';
import { ModuleGateway } from './module.gateway';

describe('ModuleGateway', () => {
  let gateway: ModuleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleGateway],
    }).compile();

    gateway = module.get<ModuleGateway>(ModuleGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
