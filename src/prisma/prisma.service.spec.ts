import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClientMock {
    $connect() {}
    $disconnect() {}
  },
}));

describe('PrismaService', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prismaService = module.get(PrismaService);
  });

  it('should call $connect on module initialization', async () => {
    jest
      .spyOn(prismaService, '$connect')
      .mockImplementation(() => Promise.resolve());
    prismaService.onModuleInit();
    expect(prismaService.$connect).toHaveBeenCalled();
  });

  it('should call $disconnect on module initialization', async () => {
    jest
      .spyOn(prismaService, '$disconnect')
      .mockImplementation(() => Promise.resolve());
    prismaService.onModuleDestroy();
    expect(prismaService.$disconnect).toHaveBeenCalled();
  });
});
