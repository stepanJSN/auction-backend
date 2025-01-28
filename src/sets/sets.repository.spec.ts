import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { SetsRepository } from './sets.repository';
import { Test } from '@nestjs/testing';
import { MOCK_CARD, MOCK_DATE } from 'config/mock-test-data';
import { NotFoundException } from '@nestjs/common';

describe('SetsRepository', () => {
  let setsRepository: SetsRepository;
  let prisma: DeepMockProxy<PrismaService>;
  const card1 = {
    ...MOCK_CARD,
    id: 'card1',
    name: 'Card 1',
  };
  const card2 = {
    ...MOCK_CARD,
    id: 'card2',
    name: 'Card 2',
  };
  const set1 = {
    id: 'set1',
    name: 'Set 1',
    bonus: 10,
    created_at: MOCK_DATE,
    cards: [card1, card2],
  };
  const set2 = {
    id: 'set2',
    name: 'Set 2',
    bonus: 20,
    created_at: MOCK_DATE,
    cards: [card1, card2],
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SetsRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    setsRepository = module.get(SetsRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new set', async () => {
      const createSetDto = {
        name: 'Test Set',
        bonus: 10,
        cardsId: [card1.id, card2.id],
      };
      const createSetPrismaResponse = {
        id: 'set1',
        name: 'Test Set',
        bonus: 10,
        created_at: MOCK_DATE,
        cards: [card1, card2],
      };

      prisma.sets.create.mockResolvedValue(createSetPrismaResponse);

      const result = await setsRepository.create(createSetDto);

      expect(prisma.sets.create).toHaveBeenCalledWith({
        data: {
          name: createSetDto.name,
          bonus: createSetDto.bonus,
          cards: {
            connect: [{ id: card1.id }, { id: card2.id }],
          },
        },
        include: {
          cards: true,
        },
      });
      expect(result).toEqual(createSetPrismaResponse);
    });
  });

  describe('findAll', () => {
    it('should return all sets', async () => {
      const page = 1;
      const take = 10;
      const setsLength = 2;
      const findManySetsWithCountPrismaResponse = [[set1, set2], setsLength];

      prisma.$transaction.mockResolvedValue(
        findManySetsWithCountPrismaResponse,
      );

      const result = await setsRepository.findAll(page, take);

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.sets.findMany({
          skip: (page - 1) * take,
          take,
          include: {
            cards: true,
          },
        }),
        prisma.sets.count(),
      ]);
      expect(result).toEqual({
        sets: [set1, set2],
        totalCount: setsLength,
      });
    });
  });

  describe('findAllWithCard', () => {
    it('should return all sets with the specified card', async () => {
      const cardId = 'card1';
      const page = 1;
      const take = 20;
      const setsLength = 2;
      const findManySetsWithCountPrismaResponse = [
        [
          { bonus: set1.bonus, cards: set1.cards.map(({ id }) => ({ id })) },
          { bonus: set2.bonus, cards: set2.cards.map(({ id }) => ({ id })) },
        ],
        setsLength,
      ];
      const condition = {
        cards: {
          some: {
            id: cardId,
          },
        },
      };

      prisma.$transaction.mockResolvedValue(
        findManySetsWithCountPrismaResponse,
      );

      const result = await setsRepository.findAllWithCard(cardId, page, take);

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.sets.findMany({
          where: condition,
          select: {
            bonus: true,
            cards: {
              select: {
                id: true,
              },
            },
          },
          skip: (page - 1) * take,
          take,
        }),
        prisma.sets.count({ where: condition }),
      ]);

      expect(result).toEqual({
        sets: [
          findManySetsWithCountPrismaResponse[0][0],
          findManySetsWithCountPrismaResponse[0][1],
        ],
        totalCount: setsLength,
      });
    });
  });

  describe('findOne', () => {
    it('should return a set', async () => {
      const id = set1.id;

      prisma.sets.findUnique.mockResolvedValue(set1);

      const result = await setsRepository.findOne(id);

      expect(prisma.sets.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          cards: true,
        },
      });

      expect(result).toEqual(set1);
    });
  });

  describe('update', () => {
    it('should update a set if it exists', async () => {
      const id = set1.id;
      const updateSetDto = {
        name: 'Updated Set',
        cardsId: [card1.id, card2.id],
      };
      const updateSetPrismaResponse = {
        ...set1,
        name: updateSetDto.name,
        cards: [card1, card2],
      };

      prisma.sets.update.mockResolvedValue(updateSetPrismaResponse);

      const result = await setsRepository.update(id, updateSetDto);

      expect(prisma.sets.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          name: updateSetDto.name,
          cards: {
            set: [{ id: card1.id }, { id: card2.id }],
          },
        },
        include: {
          cards: true,
        },
      });
      expect(result).toEqual(updateSetPrismaResponse);
    });

    it('should throw NotFoundException if set does not exist', async () => {
      const id = 'invalid-id';
      const updateSetDto = {
        name: 'Updated Set',
        cardsId: [card1.id, card2.id],
      };

      prisma.sets.update.mockRejectedValue(new Error('Prisma error'));

      await expect(setsRepository.update(id, updateSetDto)).rejects.toThrow(
        new NotFoundException('Set not found'),
      );
    });
  });

  describe('remove', () => {
    it('should remove a set if it exists', async () => {
      const id = set1.id;

      prisma.sets.delete.mockResolvedValue(set1);

      const result = await setsRepository.remove(id);

      expect(prisma.sets.delete).toHaveBeenCalledWith({
        where: { id },
        select: {
          bonus: true,
          cards: {
            select: {
              id: true,
            },
          },
        },
      });

      expect(result).toEqual(set1);
    });

    it('should not throw NotFoundException if set does not exist', async () => {
      const id = 'invalid-id';

      prisma.sets.delete.mockRejectedValue(new Error('Prisma error'));

      await expect(setsRepository.remove(id)).resolves.toBeUndefined();
    });
  });
});
