import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CardsService } from './cards.service';
import { CardsRepository } from './cards.repository';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { ImagesService } from 'src/images/images.service';
import { Test } from '@nestjs/testing';
import {
  MOCK_CARD,
  MOCK_CARD_ID,
  MOCK_DATE,
  MOCK_ID,
  MOCK_IMAGE_URL,
  MOCK_USER_ID,
} from 'config/mock-test-data';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import { Role } from '@prisma/client';

describe('CardsService', () => {
  let cardsService: CardsService;
  let cardsRepository: DeepMockProxy<CardsRepository>;
  let cardsInstancesService: DeepMockProxy<CardInstancesService>;
  let imagesService: DeepMockProxy<ImagesService>;

  const createCardPayload = {
    name: MOCK_CARD.name,
    type: MOCK_CARD.type,
    locationId: MOCK_CARD.location_id,
    gender: MOCK_CARD.gender,
    isActive: MOCK_CARD.is_active,
    episodesId: [1, 2, 3],
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

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardsService,
        { provide: CardsRepository, useValue: mockDeep<CardsRepository>() },
        {
          provide: CardInstancesService,
          useValue: mockDeep<CardInstancesService>(),
        },
        { provide: ImagesService, useValue: mockDeep<ImagesService>() },
      ],
    }).compile();

    cardsService = module.get(CardsService);
    cardsRepository = module.get(CardsRepository);
    cardsInstancesService = module.get(CardInstancesService);
    imagesService = module.get(ImagesService);
  });

  describe('create', () => {
    it('should not create a new card if not all cards from the API were sold', async () => {
      cardsRepository.findAll.mockResolvedValue([MOCK_CARD]);
      cardsRepository.countNumberOfCards.mockResolvedValue(1);
      cardsInstancesService.findAll.mockResolvedValue([]);

      await expect(
        cardsService.create(createCardPayload, image),
      ).rejects.toThrow(
        new BadRequestException('Not all cards from the API were sold'),
      );
    });

    it('should create a new card and upload the image', async () => {
      const mockCardInstance = {
        id: MOCK_ID,
        created_at: MOCK_DATE,
        card_id: MOCK_CARD_ID,
        user_id: MOCK_USER_ID,
      };
      const mockTimestamp = 1672531200000; // January 1, 2023
      const mockFilename = `${mockTimestamp}${image.originalname}`;
      cardsRepository.findAll.mockResolvedValue([MOCK_CARD]);
      cardsRepository.countNumberOfCards.mockResolvedValue(1);
      cardsInstancesService.findAll.mockResolvedValue([mockCardInstance]);

      imagesService.upload.mockResolvedValue(MOCK_IMAGE_URL);
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      cardsRepository.create.mockResolvedValue(MOCK_CARD_ID);

      const result = await cardsService.create(createCardPayload, image);

      expect(imagesService.upload).toHaveBeenCalledTimes(1);
      expect(imagesService.upload).toHaveBeenCalledWith(mockFilename, image);
      expect(cardsRepository.create).toHaveBeenCalledTimes(1);
      expect(cardsRepository.create).toHaveBeenCalledWith({
        ...createCardPayload,
        imageUrl: MOCK_IMAGE_URL,
      });
      expect(result).toEqual(MOCK_CARD_ID);
    });
  });

  describe('findAllWithDetails', () => {
    it('should return active cards with ownership flag for User role', async () => {
      const findAllPayload = {
        userId: MOCK_USER_ID,
        role: Role.User,
        name: MOCK_CARD.name,
      };
      const mockFindAllResponse = {
        data: [MOCK_CARD],
        info: { page: 1, totalCount: 40, totalPages: 2 },
      };

      jest
        .spyOn(cardsService, 'findAll')
        .mockResolvedValue(mockFindAllResponse);
      cardsInstancesService.attachOwnershipFlag.mockResolvedValue([
        { ...MOCK_CARD, is_owned: false },
      ]);

      const result = await cardsService.findAllWithDetails(findAllPayload);

      expect(cardsService.findAll).toHaveBeenCalledWith({
        role: findAllPayload.role,
        name: findAllPayload.name,
        page: 1,
        take: 20,
      });
      expect(result).toEqual({
        data: [{ ...MOCK_CARD, is_owned: false }],
        info: mockFindAllResponse.info,
      });
      jest.restoreAllMocks();
    });

    it('should return all cards for Admin role', async () => {
      const findAllPayload = {
        userId: MOCK_USER_ID,
        role: Role.Admin,
        name: MOCK_CARD.name,
      };
      const mockFindAllResponse = {
        data: [MOCK_CARD],
        info: { page: 1, totalCount: 40, totalPages: 2 },
      };

      jest
        .spyOn(cardsService, 'findAll')
        .mockResolvedValue(mockFindAllResponse);

      const result = await cardsService.findAllWithDetails(findAllPayload);

      expect(cardsService.findAll).toHaveBeenCalledWith({
        role: findAllPayload.role,
        name: findAllPayload.name,
        page: 1,
        take: 20,
      });
      expect(result).toEqual({
        data: [MOCK_CARD],
        info: mockFindAllResponse.info,
      });
      jest.restoreAllMocks();
    });
  });

  it('should count number of cards created by admin', async () => {
    cardsRepository.countNumberOfCards.mockResolvedValue(40);
    const result = await cardsService.countNumberOfCardsCreatedByAdmin();
    expect(cardsRepository.countNumberOfCards).toHaveBeenCalledWith({
      isCreatedByAdmin: true,
    });
    expect(result).toEqual(40);
  });

  it('should find all cards', async () => {
    const pagination = {
      page: 1,
      take: 20,
    };
    cardsRepository.findAll.mockResolvedValue([MOCK_CARD]);
    cardsRepository.countNumberOfCards.mockResolvedValue(40);
    const result = await cardsService.findAll({
      userId: MOCK_USER_ID,
      page: pagination.page,
      take: pagination.take,
    });
    expect(cardsRepository.findAll).toHaveBeenCalledWith({
      userId: MOCK_USER_ID,
      page: pagination.page,
      take: pagination.take,
    });
    expect(cardsRepository.countNumberOfCards).toHaveBeenCalledWith({
      userId: MOCK_USER_ID,
    });
    expect(result).toEqual({
      data: [MOCK_CARD],
      info: { page: 1, totalCount: 40, totalPages: 2 },
    });
  });

  describe('findOne', () => {
    it('should throw error if card not found', async () => {
      cardsRepository.findOneById.mockResolvedValue(null);
      await expect(cardsService.findOne(MOCK_CARD_ID)).rejects.toThrow(
        new NotFoundException('Card not found'),
      );
    });

    it('should return card without ownership flag if user id was not provided', async () => {
      cardsRepository.findOneById.mockResolvedValue(
        mockCardWithEpisodesAndLocation,
      );
      const result = await cardsService.findOne(MOCK_CARD_ID, true);

      expect(cardsRepository.findOneById).toHaveBeenCalledTimes(1);
      expect(cardsRepository.findOneById).toHaveBeenCalledWith(
        MOCK_CARD_ID,
        true,
      );
      expect(result).toEqual(mockCardWithEpisodesAndLocation);
    });

    it('should return card with ownership flag if user id was provided', async () => {
      cardsRepository.findOneById.mockResolvedValue(
        mockCardWithEpisodesAndLocation,
      );
      cardsInstancesService.attachOwnershipFlag.mockResolvedValue([
        { ...mockCardWithEpisodesAndLocation, is_owned: true },
      ]);
      const result = await cardsService.findOne(
        MOCK_CARD_ID,
        true,
        MOCK_USER_ID,
      );

      expect(cardsRepository.findOneById).toHaveBeenCalledTimes(1);
      expect(cardsRepository.findOneById).toHaveBeenCalledWith(
        MOCK_CARD_ID,
        true,
      );
      expect(result).toEqual({
        ...mockCardWithEpisodesAndLocation,
        is_owned: true,
      });
    });
  });

  describe('update', () => {
    it('should update a card and image if it was provided successfully', async () => {
      const mockTimestamp = 1672531200000; // January 1, 2023
      const mockFilename = `${mockTimestamp}${image.originalname}`;
      cardsRepository.findOneById.mockResolvedValue(
        mockCardWithEpisodesAndLocation,
      );
      imagesService.delete.mockResolvedValue();
      imagesService.upload.mockResolvedValue(MOCK_IMAGE_URL);
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      cardsRepository.update.mockResolvedValue(MOCK_CARD);

      const result = await cardsService.update(
        MOCK_CARD_ID,
        createCardPayload,
        image,
      );

      expect(cardsRepository.findOneById).toHaveBeenCalledTimes(1);
      expect(cardsRepository.findOneById).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(imagesService.delete).toHaveBeenCalledTimes(1);
      expect(imagesService.delete).toHaveBeenCalledWith(
        mockCardWithEpisodesAndLocation.image_url,
      );
      expect(imagesService.upload).toHaveBeenCalledTimes(1);
      expect(imagesService.upload).toHaveBeenCalledWith(mockFilename, image);
      expect(cardsRepository.update).toHaveBeenCalledTimes(1);
      expect(cardsRepository.update).toHaveBeenCalledWith(MOCK_CARD_ID, {
        ...createCardPayload,
        imageUrl: MOCK_IMAGE_URL,
      });
      expect(result).toEqual(MOCK_CARD);
    });
  });

  describe('remove', () => {
    it('should remove a card successfully', async () => {
      cardsRepository.findOneById.mockResolvedValue(
        mockCardWithEpisodesAndLocation,
      );
      imagesService.delete.mockResolvedValue();
      cardsRepository.delete.mockResolvedValue(MOCK_CARD);

      await cardsService.remove(MOCK_CARD_ID);

      expect(cardsRepository.findOneById).toHaveBeenCalledWith(MOCK_CARD_ID);
      expect(imagesService.delete).toHaveBeenCalledTimes(1);
      expect(imagesService.delete).toHaveBeenCalledWith(
        mockCardWithEpisodesAndLocation.image_url,
      );
      expect(cardsRepository.delete).toHaveBeenCalledTimes(1);
      expect(cardsRepository.delete).toHaveBeenCalledWith(MOCK_CARD_ID);
    });
  });
});
