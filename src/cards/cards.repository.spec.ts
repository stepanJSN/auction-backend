import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CardsRepository } from './cards.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { MOCK_CARD, MOCK_IMAGE_URL, MOCK_USER_ID } from 'config/mock-test-data';
import { NotFoundException } from '@nestjs/common';

describe('CardsRepository', () => {
  let cardsRepository: CardsRepository;
  let prismaService: DeepMockProxy<PrismaService>;

  const mockCreateCardData = {
    name: MOCK_CARD.name,
    type: MOCK_CARD.type,
    locationId: MOCK_CARD.location_id,
    gender: MOCK_CARD.gender,
    isActive: MOCK_CARD.is_active,
    episodesId: [1, 2, 3],
    imageUrl: MOCK_IMAGE_URL,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CardsRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    cardsRepository = module.get(CardsRepository);
    prismaService = module.get(PrismaService);
  });

  it('should create a new card successfully', async () => {
    prismaService.cards.create.mockResolvedValue(MOCK_CARD);

    const result = await cardsRepository.create(mockCreateCardData);

    expect(prismaService.cards.create).toHaveBeenCalledTimes(1);
    expect(prismaService.cards.create).toHaveBeenCalledWith({
      data: {
        name: mockCreateCardData.name,
        type: mockCreateCardData.type,
        gender: mockCreateCardData.gender,
        image_url: mockCreateCardData.imageUrl,
        is_active: mockCreateCardData.isActive,
        is_created_by_admin: true,
        episodes: {
          connect: mockCreateCardData.episodesId.map((episodeId) => ({
            id: episodeId,
          })),
        },
        location: {
          connect: {
            id: mockCreateCardData.locationId,
          },
        },
      },
    });
    expect(result).toEqual(MOCK_CARD.id);
  });

  it('should find all cards according to the payload successfully', async () => {
    const findAllPayload = {
      page: 2,
      take: 10,
      name: MOCK_CARD.name,
      userId: MOCK_USER_ID,
      active: MOCK_CARD.is_active,
      isCreatedByAdmin: MOCK_CARD.is_created_by_admin,
    };

    prismaService.cards.findMany.mockResolvedValue([MOCK_CARD]);

    const result = await cardsRepository.findAll(findAllPayload);

    expect(prismaService.cards.findMany).toHaveBeenCalledTimes(1);
    expect(prismaService.cards.findMany).toHaveBeenCalledWith({
      where: {
        is_active: findAllPayload.active,
        name: {
          contains: findAllPayload.name,
        },
        is_created_by_admin: findAllPayload.isCreatedByAdmin,
        ...(findAllPayload.userId && {
          card_instances: {
            some: {
              user_id: findAllPayload.userId,
            },
          },
        }),
      },
      skip: (findAllPayload.page - 1) * findAllPayload.take,
      take: findAllPayload.take,
      orderBy: {
        created_at: 'asc',
      },
    });
    expect(result).toEqual([MOCK_CARD]);
  });

  it('should count all cards according to the payload successfully', async () => {
    const countPayload = {
      active: MOCK_CARD.is_active,
      name: MOCK_CARD.name,
      isCreatedByAdmin: MOCK_CARD.is_created_by_admin,
      userId: MOCK_USER_ID,
    };

    prismaService.cards.count.mockResolvedValue(1);

    const result = await cardsRepository.countNumberOfCards(countPayload);

    expect(prismaService.cards.count).toHaveBeenCalledTimes(1);
    expect(prismaService.cards.count).toHaveBeenCalledWith({
      where: {
        is_active: countPayload.active,
        name: {
          contains: countPayload.name,
        },
        is_created_by_admin: countPayload.isCreatedByAdmin,
        ...(countPayload.userId && {
          card_instances: {
            some: {
              user_id: countPayload.userId,
            },
          },
        }),
      },
    });
    expect(result).toEqual(1);
  });

  it('should find one card with relations successfully', async () => {
    const mockCardId = MOCK_CARD.id;
    prismaService.cards.findUnique.mockResolvedValue(MOCK_CARD);

    const result = await cardsRepository.findOneById(mockCardId, true);

    expect(prismaService.cards.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaService.cards.findUnique).toHaveBeenCalledWith({
      where: { id: mockCardId },
      include: {
        episodes: true,
        location: true,
      },
    });
    expect(result).toEqual(MOCK_CARD);
  });

  it('should find one card without relations successfully', async () => {
    const mockCardId = MOCK_CARD.id;
    prismaService.cards.findUnique.mockResolvedValue(MOCK_CARD);

    const result = await cardsRepository.findOneById(mockCardId, false);

    expect(prismaService.cards.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaService.cards.findUnique).toHaveBeenCalledWith({
      where: { id: mockCardId },
      include: {
        episodes: false,
        location: false,
      },
    });
    expect(result).toEqual(MOCK_CARD);
  });

  it('should throw an error if card with given id is not found (update)', async () => {
    const mockCardId = MOCK_CARD.id;
    prismaService.cards.update.mockRejectedValue(new Error('Prisma error'));

    await expect(
      cardsRepository.update(mockCardId, mockCreateCardData),
    ).rejects.toThrow(new NotFoundException('Card not found'));
  });

  it('should update a card successfully', async () => {
    const mockCardId = MOCK_CARD.id;
    prismaService.cards.update.mockResolvedValue(MOCK_CARD);

    const result = await cardsRepository.update(mockCardId, mockCreateCardData);

    expect(prismaService.cards.update).toHaveBeenCalledTimes(1);
    expect(prismaService.cards.update).toHaveBeenCalledWith({
      where: { id: mockCardId },
      data: {
        name: mockCreateCardData.name,
        type: mockCreateCardData.type,
        gender: mockCreateCardData.gender,
        image_url: mockCreateCardData.imageUrl,
        is_active: mockCreateCardData.isActive,
        episodes: {
          set: mockCreateCardData.episodesId?.map((episodeId) => ({
            id: episodeId,
          })),
        },
        location: mockCreateCardData.locationId && {
          connect: { id: mockCreateCardData.locationId },
        },
      },
    });

    expect(result).toEqual(MOCK_CARD);
  });

  it('should not throw an error if card with given id is not found (delete)', async () => {
    const mockCardId = MOCK_CARD.id;
    prismaService.cards.delete.mockRejectedValue(new Error('Prisma error'));

    const result = await cardsRepository.delete(mockCardId);
    expect(result).toBeUndefined();
  });

  it('should delete a card successfully', async () => {
    const mockCardId = MOCK_CARD.id;
    prismaService.cards.delete.mockResolvedValue(MOCK_CARD);

    const result = await cardsRepository.delete(mockCardId);

    expect(prismaService.cards.delete).toHaveBeenCalledTimes(1);
    expect(prismaService.cards.delete).toHaveBeenCalledWith({
      where: { id: mockCardId },
    });

    expect(result).toEqual(MOCK_CARD);
  });
});
