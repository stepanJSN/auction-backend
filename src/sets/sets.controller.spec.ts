import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { SetsController } from './sets.controller';
import { SetsService } from './sets.service';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { MOCK_USER_ID } from 'config/mock-test-data';
import { SET_1, SET_2 } from './mockData';

describe('SetsController', () => {
  let setsController: SetsController;
  let setsService: DeepMockProxy<SetsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SetsController],
      providers: [{ provide: SetsService, useValue: mockDeep<SetsService>() }],
    }).compile();

    setsController = module.get(SetsController);
    setsService = module.get(SetsService);
  });

  describe('create', () => {
    it('should create a set', async () => {
      const createSetDto = {
        name: 'Set 1',
        cardsId: ['card1', 'card2'],
        bonus: 10,
      };
      const mockCreateSetServiceResponse = 'set1';

      setsService.create.mockResolvedValue(mockCreateSetServiceResponse);

      const result = await setsController.create(createSetDto);
      expect(result).toEqual(mockCreateSetServiceResponse);
    });
  });

  describe('findAll', () => {
    it('should return an array of sets', async () => {
      const findAllDto = {
        page: 1,
        take: 10,
      };
      const userData = {
        id: MOCK_USER_ID,
        role: Role.Admin,
        email: 'admin@gmail.com',
      };
      const mockFindAllServiceResponse = {
        data: [SET_1, SET_2],
        info: {
          page: findAllDto.page,
          totalCount: 2,
          totalPages: 1,
        },
      };

      setsService.findAll.mockResolvedValue(mockFindAllServiceResponse);

      const result = await setsController.findAll(userData, findAllDto);
      expect(result).toEqual(mockFindAllServiceResponse);
    });
  });

  describe('findOne', () => {
    it('should return a set', async () => {
      const id = SET_1.id;
      const mockFindOneServiceResponse = SET_1;

      setsService.findOne.mockResolvedValue(mockFindOneServiceResponse);

      const result = await setsController.findOne(id);
      expect(result).toEqual(mockFindOneServiceResponse);
    });
  });

  describe('update', () => {
    it('should update a set', async () => {
      const id = SET_1.id;
      const updateSetDto = {
        name: 'Updated Set',
      };
      const mockUpdateSetServiceResponse = {
        ...SET_1,
        name: updateSetDto.name,
      };

      setsService.update.mockResolvedValue(mockUpdateSetServiceResponse);

      const result = await setsController.update(id, updateSetDto);
      expect(result).toEqual(mockUpdateSetServiceResponse);
    });
  });

  describe('remove', () => {
    it('should delete a set', async () => {
      const id = SET_1.id;

      const result = await setsController.remove(id);
      expect(result).toBeUndefined();
    });
  });
});
