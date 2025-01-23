import { PrismaService } from 'src/prisma/prisma.service';
import { CardInstancesRepository } from './card-instances.repository';
import { Test } from '@nestjs/testing';
import {
  MOCK_CARD_ID,
  MOCK_DATE,
  MOCK_ID,
  MOCK_USER_ID,
} from 'config/mock-test-data';

describe('CardInstancesRepository', () => {
  let cardInstancesRepository: CardInstancesRepository;
  let prismaService: PrismaService;

  const mockCardInstance = {
    id: MOCK_ID,
    user_id: MOCK_USER_ID,
    created_at: MOCK_DATE,
    card_id: MOCK_CARD_ID,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CardInstancesRepository, PrismaService],
    }).compile();

    cardInstancesRepository = module.get(CardInstancesRepository);
    prismaService = module.get(PrismaService);
  });

  it('should create a new card instance successfully', async () => {
    const mockCardInstanceData = {
      cardId: MOCK_CARD_ID,
      userId: MOCK_USER_ID,
    };

    jest
      .spyOn(prismaService.card_instances, 'create')
      .mockResolvedValue(mockCardInstance);

    const result = await cardInstancesRepository.create(mockCardInstanceData);

    expect(prismaService.card_instances.create).toHaveBeenCalledTimes(1);
    expect(prismaService.card_instances.create).toHaveBeenCalledWith({
      data: {
        user_id: MOCK_USER_ID,
        card_id: MOCK_CARD_ID,
      },
    });
    expect(result).toEqual(mockCardInstance);
  });

  it('should find one card instance successfully', async () => {
    const mockCardInstanceId = MOCK_ID;

    jest
      .spyOn(prismaService.card_instances, 'findUnique')
      .mockResolvedValue(mockCardInstance);

    const result = await cardInstancesRepository.findOne(mockCardInstanceId);

    expect(prismaService.card_instances.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaService.card_instances.findUnique).toHaveBeenCalledWith({
      where: { id: mockCardInstanceId },
    });
    expect(result).toEqual(mockCardInstance);
  });

  it('should find all card instances successfully', async () => {
    jest
      .spyOn(prismaService.card_instances, 'findMany')
      .mockResolvedValue([mockCardInstance]);

    const result = await cardInstancesRepository.findAll({
      cardsId: [MOCK_CARD_ID],
      userId: MOCK_USER_ID,
    });

    expect(prismaService.card_instances.findMany).toHaveBeenCalledTimes(1);
    expect(prismaService.card_instances.findMany).toHaveBeenCalledWith({
      where: {
        card_id: { in: [MOCK_CARD_ID] },
        user_id: MOCK_USER_ID,
      },
    });
    expect(result).toEqual([mockCardInstance]);
  });

  it('should update a card instance successfully', async () => {
    const mockCardInstanceId = MOCK_ID;
    const mockCardInstanceData = {
      cardId: MOCK_CARD_ID,
      userId: MOCK_USER_ID,
    };

    jest
      .spyOn(prismaService.card_instances, 'update')
      .mockResolvedValue(mockCardInstance);

    const result = await cardInstancesRepository.update(
      mockCardInstanceId,
      mockCardInstanceData,
    );

    expect(prismaService.card_instances.update).toHaveBeenCalledTimes(1);
    expect(prismaService.card_instances.update).toHaveBeenCalledWith({
      where: { id: mockCardInstanceId },
      data: {
        user_id: MOCK_USER_ID,
        card_id: MOCK_CARD_ID,
      },
    });
    expect(result).toEqual(mockCardInstance);
  });

  it('should count card instances successfully', async () => {
    jest.spyOn(prismaService.card_instances, 'count').mockResolvedValue(1);

    const result = await cardInstancesRepository.countByCardId(MOCK_CARD_ID);

    expect(prismaService.card_instances.count).toHaveBeenCalledTimes(1);
    expect(prismaService.card_instances.count).toHaveBeenCalledWith({
      where: { card_id: MOCK_CARD_ID },
    });
    expect(result).toEqual(1);
  });

  it('should group card instances by user id successfully', async () => {
    prismaService.card_instances.groupBy = jest
      .fn()
      .mockResolvedValue([{ user_id: MOCK_USER_ID, _count: { id: 1 } }]);

    const result = await cardInstancesRepository.groupByUserIdWithCards([
      MOCK_CARD_ID,
    ]);

    expect(prismaService.card_instances.groupBy).toHaveBeenCalledTimes(1);
    expect(prismaService.card_instances.groupBy).toHaveBeenCalledWith({
      by: 'user_id',
      where: { card_id: { in: [MOCK_CARD_ID] } },
      _count: { card_id: true },
    });
    expect(result).toEqual([{ user_id: MOCK_USER_ID, _count: { id: 1 } }]);
  });
});
