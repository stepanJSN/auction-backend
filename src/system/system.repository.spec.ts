import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemRepository } from './system.repository';
import { MOCK_DATE } from 'config/mock-test-data';
import { NotFoundException } from '@nestjs/common';

describe('SystemRepository', () => {
  let systemRepository: SystemRepository;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SystemRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    systemRepository = module.get(SystemRepository);
    prisma = module.get(PrismaService);
  });

  describe('findOne', () => {
    it('should return the system value', async () => {
      const key = 'test_key';
      const mockValue = {
        id: 'test_id',
        key,
        value: 'test_value',
        updated_at: MOCK_DATE,
      };

      prisma.system.findUnique.mockResolvedValue(mockValue);

      await expect(systemRepository.findOne(key)).resolves.toEqual(mockValue);
      expect(prisma.system.findUnique).toHaveBeenCalledWith({
        where: { key },
      });
    });
  });

  describe('update', () => {
    it('should update the system value if it exists', async () => {
      const key = 'test_key';
      const newValue = 'updated_value';
      const mockValue = {
        id: 'test_id',
        key,
        value: newValue,
        updated_at: MOCK_DATE,
      };

      prisma.system.update.mockResolvedValue(mockValue);

      await expect(systemRepository.update(key, newValue)).resolves.toEqual(
        mockValue,
      );
      expect(prisma.system.update).toHaveBeenCalledWith({
        where: { key },
        data: {
          value: newValue,
        },
      });
    });

    it('should throw a NotFoundException if the system value does not exist', async () => {
      const key = 'not_found_key';
      const newValue = 'updated_value';

      prisma.system.update.mockRejectedValue(new Error('Not found error'));

      await expect(systemRepository.update(key, newValue)).rejects.toThrow(
        new NotFoundException('Record with such key not found'),
      );
      expect(prisma.system.update).toHaveBeenCalledWith({
        where: { key },
        data: {
          value: newValue,
        },
      });
    });
  });
});
