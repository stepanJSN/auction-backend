import { PrismaService } from 'src/prisma/prisma.service';
import { ChatsRepository } from './chats.repository';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import {
  MOCK_DATE,
  MOCK_ID,
  MOCK_USER2_ID,
  MOCK_USER_ID,
} from 'config/mock-test-data';
import { NotFoundException } from '@nestjs/common';

describe('ChatsRepository', () => {
  let chatsRepository: ChatsRepository;
  let prisma: DeepMockProxy<PrismaService>;
  const MOCK_CHAT_NAME = 'Test Chat';
  const mockPrismaResponse = {
    users: [
      {
        name: 'User1',
        id: MOCK_USER_ID,
        surname: 'User1Surname',
      },
      {
        name: 'User2',
        id: MOCK_USER2_ID,
        surname: 'User2Surname',
      },
    ],
    name: MOCK_CHAT_NAME,
    id: MOCK_ID,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ChatsRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    chatsRepository = module.get(ChatsRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a chat successfully', async () => {
      const chatData = {
        participants: [MOCK_USER_ID, MOCK_USER2_ID],
        name: MOCK_CHAT_NAME,
      };
      const mockPrismaResponse = {
        users: [
          {
            name: 'User1',
            id: MOCK_USER_ID,
            surname: 'User1Surname',
          },
          {
            name: 'User2',
            id: MOCK_USER2_ID,
            surname: 'User2Surname',
          },
        ],
        name: MOCK_CHAT_NAME,
        id: MOCK_ID,
      };
      prisma.chats.create.mockResolvedValue(mockPrismaResponse as any);
      const result = await chatsRepository.create(chatData);

      expect(prisma.chats.create).toHaveBeenCalledTimes(1);
      expect(prisma.chats.create).toHaveBeenCalledWith({
        data: {
          name: MOCK_CHAT_NAME,
          users: {
            connect: [{ id: MOCK_USER_ID }, { id: MOCK_USER2_ID }],
          },
        },
        select: {
          id: true,
          name: true,
          users: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPrismaResponse);
    });
  });

  describe('findAll', () => {
    it('should find all chats successfully', async () => {
      const findAllChatsPayload = {
        userId: MOCK_USER_ID,
        page: 1,
        take: 10,
        name: 'User',
      };
      const mockTotalCount = 2;

      prisma.$transaction.mockResolvedValue([
        mockPrismaResponse,
        mockTotalCount,
      ]);
      const result = await chatsRepository.findAll(findAllChatsPayload);
      const conditions = {
        users: {
          some: {
            id: findAllChatsPayload.userId,
          },
        },
        OR: [
          {
            users: {
              some: {
                name: { contains: findAllChatsPayload.name },
              },
            },
          },
          {
            users: {
              some: {
                surname: { contains: findAllChatsPayload.name },
              },
            },
          },
          {
            users: {
              some: {
                AND: [
                  {
                    name: { contains: findAllChatsPayload.name.split(' ')[0] },
                  },
                  {
                    surname: {
                      contains: findAllChatsPayload.name.split(' ')[1] || '',
                    },
                  },
                ],
              },
            },
          },
          { name: { contains: findAllChatsPayload.name } },
        ],
      };

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.chats.findMany({
          where: conditions,
          orderBy: {
            created_at: 'desc',
          },
          select: {
            id: true,
            users: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
            name: true,
            messages: {
              select: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                  },
                },
                id: true,
                message: true,
                created_at: true,
              },
              orderBy: {
                created_at: 'desc',
              },
              take: 1,
            },
          },
          skip: (findAllChatsPayload.page - 1) * findAllChatsPayload.take,
          take: findAllChatsPayload.take,
        }),
        prisma.chats.count({
          where: conditions,
        }),
      ]);

      expect(result).toEqual({
        chats: mockPrismaResponse,
        totalCount: mockTotalCount,
      });
    });
  });

  describe('findOne', () => {
    it('should find a chat successfully', async () => {
      prisma.chats.findUnique.mockResolvedValue(mockPrismaResponse as any);
      const result = await chatsRepository.findOne(MOCK_ID);

      expect(prisma.chats.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.chats.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_ID },
        select: {
          id: true,
          name: true,
          users: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPrismaResponse);
    });
  });

  describe('findAllChatsWithUsers', () => {
    it('should find all chats with users successfully', async () => {
      const mockPrismaResponse = [
        {
          users: [
            {
              id: MOCK_USER_ID,
            },
            {
              id: MOCK_USER2_ID,
            },
          ],
          id: MOCK_ID,
        },
      ];
      prisma.chats.findMany.mockResolvedValue(mockPrismaResponse as any);
      const result = await chatsRepository.findAllChatsWithUsers(
        MOCK_USER_ID,
        MOCK_USER2_ID,
      );

      expect(prisma.chats.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.chats.findMany).toHaveBeenCalledWith({
        where: {
          users: {
            every: {
              id: {
                in: [MOCK_USER_ID, MOCK_USER2_ID],
              },
            },
          },
        },
        select: {
          id: true,
          users: {
            select: {
              id: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPrismaResponse);
    });
  });

  describe('update', () => {
    it('should update a chat successfully if chat exists', async () => {
      const newChatData = {
        participants: [MOCK_USER_ID, MOCK_USER2_ID],
      };
      prisma.chats.update.mockResolvedValue(mockPrismaResponse as any);
      const result = await chatsRepository.update(MOCK_ID, newChatData);

      expect(prisma.chats.update).toHaveBeenCalledTimes(1);
      expect(prisma.chats.update).toHaveBeenCalledWith({
        where: { id: MOCK_ID },
        data: {
          users: {
            set: newChatData.participants.map((participant) => ({
              id: participant,
            })),
          },
        },
        select: {
          id: true,
          name: true,
          users: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPrismaResponse);
    });

    it('should throw NotFoundException if chat does not exist', async () => {
      const newChatData = {
        name: 'New chat name',
      };
      prisma.chats.update.mockRejectedValue(new Error('Prisma error'));
      await expect(
        chatsRepository.update(MOCK_ID, newChatData),
      ).rejects.toThrow(new NotFoundException('Chat not found'));
    });
  });

  describe('remove', () => {
    it('should remove a chat successfully if chat exists', async () => {
      const mockPrismaResponse = {
        id: MOCK_ID,
        name: MOCK_CHAT_NAME,
        created_at: MOCK_DATE,
      };

      prisma.chats.delete.mockResolvedValue(mockPrismaResponse);

      const result = await chatsRepository.remove(MOCK_ID);

      expect(prisma.chats.delete).toHaveBeenCalledTimes(1);
      expect(prisma.chats.delete).toHaveBeenCalledWith({
        where: { id: MOCK_ID },
      });
      expect(result).toEqual(mockPrismaResponse);
    });
    it('should not throw exception if chat does not exist', async () => {
      prisma.chats.delete.mockRejectedValue(new Error('Prisma error'));
      await expect(chatsRepository.remove(MOCK_ID)).resolves.toBeUndefined();
    });
  });
});
