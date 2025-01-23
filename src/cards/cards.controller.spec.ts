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
import { Readable } from 'stream';
import { Role } from '@prisma/client';

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

  const createCardDto = {
    name: MOCK_CARD.name,
    type: MOCK_CARD.type,
    locationId: MOCK_CARD.location_id,
    gender: MOCK_CARD.gender,
    isActive: MOCK_CARD.is_active,
    episodesId: [1, 2, 3],
  };
  const mockCardWithEpisodesAndLocation = {
    ...MOCK_CARD,
    episodes: [
      {
        id: 1,
        name: 'episode 1',
        code: '1234',
      },
    ],
    location: {
      id: 1,
      name: 'location 1',
      type: 'location type 1',
    },
  };
  const image: Express.Multer.File = {
    originalname: 'image.png',
    buffer: Buffer.from('image'),
    fieldname: '',
    encoding: '',
    mimetype: '',
    size: 0,
    stream: new Readable(),
    destination: '',
    filename: '',
    path: '',
  };

  describe('create', () => {
    it('should create a card', () => {
      cardsService.create.mockResolvedValue(MOCK_CARD.id);
      const result = cardsController.create(image, createCardDto);
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
      cardsService.findAll.mockResolvedValue(mockServiceResponse);
      const result = cardsController.findAll(user, {
        ...MOCK_PAGINATION,
        name: MOCK_CARD.name,
      });
      expect(cardsService.findAll).toHaveBeenCalledWith({
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
      cardsService.findAllByUserId.mockResolvedValue(mockServiceResponse);
      const result = cardsController.findMyCards(MOCK_USER_ID, MOCK_PAGINATION);
      expect(cardsService.findAll).toHaveBeenCalledWith(
        MOCK_USER_ID,
        MOCK_PAGINATION,
      );
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
});
