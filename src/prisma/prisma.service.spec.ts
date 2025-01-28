import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { INestApplication } from '@nestjs/common';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('PrismaService', () => {
  let prismaService: PrismaService;
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prismaService = module.get(PrismaService);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => await app.close());

  it('should call $connect on module initialization', async () => {
    jest.spyOn(prismaService, '$connect');
    expect(prismaService.$connect).toHaveBeenCalled();
  });

  it('should call $disconnect on module destruction', async () => {
    jest.spyOn(prismaService, '$disconnect');
    expect(prismaService.$disconnect).toHaveBeenCalled();
  });
});
