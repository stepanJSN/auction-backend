import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { Test } from '@nestjs/testing';
import {
  MOCK_CARD,
  MOCK_EMAIL,
  MOCK_PAGINATION,
  MOCK_USER_ID,
} from 'config/mock-test-data';
import { Role } from '@prisma/client';
import {
  mockImage,
  createCardDto,
  mockCardWithEpisodesAndLocation,
} from './mockData';

describe('CardsController', () => {
  let cardsController: CardsController;
  let cardsService: DeepMockProxy<CardsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CardsController],
      providers: [
        {
          provide: CardsService,
          useValue: mockDeep<CardsService>(),
        },
      ],
    }).compile();

    cardsController = module.get(CardsController);
    cardsService = module.get(CardsService);
  });

  describe('create', () => {
    it('should create a card', () => {
      cardsService.create.mockResolvedValue(MOCK_CARD.id);
      const result = cardsController.create(mockImage, createCardDto);
      expect(result).resolves.toEqual(MOCK_CARD.id);
    });
  });

  describe('findAll', () => {
    it('should return an array of cards', () => {
      const user = {
        id: MOCK_USER_ID,
        role: Role.User,
        email: MOCK_EMAIL,
      };
      const mockServiceResponse = {
        data: [MOCK_CARD],
        info: { page: MOCK_PAGINATION.page, totalCount: 40, totalPages: 2 },
      };
      cardsService.findAllWithDetails.mockResolvedValue(mockServiceResponse);
      const result = cardsController.findAll(user, {
        ...MOCK_PAGINATION,
        name: MOCK_CARD.name,
      });
      expect(cardsService.findAllWithDetails).toHaveBeenCalledWith({
        userId: user.id,
        role: user.role,
        page: MOCK_PAGINATION.page,
        take: MOCK_PAGINATION.take,
        name: MOCK_CARD.name,
      });
      expect(result).resolves.toEqual(mockServiceResponse);
    });
  });

  describe('findUserCards', () => {
    it('should return an array of cards', () => {
      const mockServiceResponse = {
        data: [MOCK_CARD],
        info: { page: MOCK_PAGINATION.page, totalCount: 40, totalPages: 2 },
      };
      cardsService.findAll.mockResolvedValue(mockServiceResponse);
      const result = cardsController.findMyCards(MOCK_USER_ID, MOCK_PAGINATION);
      expect(cardsService.findAll).toHaveBeenCalledWith({
        userId: MOCK_USER_ID,
        ...MOCK_PAGINATION,
      });
      expect(result).resolves.toEqual(mockServiceResponse);
    });
  });

  describe('findOne', () => {
    it('should return a card', () => {
      cardsService.findOne.mockResolvedValue(mockCardWithEpisodesAndLocation);
      const result = cardsController.findOne(MOCK_USER_ID, MOCK_CARD.id);
      expect(cardsService.findOne).toHaveBeenCalledWith(
        MOCK_CARD.id,
        true,
        MOCK_USER_ID,
      );
      expect(result).resolves.toEqual(mockCardWithEpisodesAndLocation);
    });
  });

  describe('update', () => {
    it('should update a card', () => {
      cardsService.update.mockResolvedValue(MOCK_CARD);
      const result = cardsController.update(
        MOCK_CARD.id,
        createCardDto,
        mockImage,
      );
      expect(result).resolves.toEqual(MOCK_CARD);
    });
  });

  describe('remove', () => {
    it('should remove a card', async () => {
      cardsService.remove.mockResolvedValue();
      await cardsController.remove(MOCK_CARD.id);
      expect(cardsService.remove).toHaveBeenCalledTimes(1);
    });
  });
});
