import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { MessagesRepository } from './messages.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { MOCK_DATE, MOCK_USER_ID } from 'config/mock-test-data';
import { NotFoundException } from '@nestjs/common';

describe('MessagesRepository', () => {
  let messagesRepository: MessagesRepository;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MessagesRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    messagesRepository = module.get(MessagesRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new message', async () => {
      const createMessageDto = {
        chatId: 'chatId',
        message: 'Hello',
        senderId: MOCK_USER_ID,
      };
      const mockCreatePrismaResponse = {
        id: 'messageId',
        chat_id: createMessageDto.chatId,
        message: createMessageDto.message,
        created_at: MOCK_DATE,
        sender: {
          id: createMessageDto.senderId,
          name: 'Username',
          surname: 'UserSurname',
        },
      };

      prisma.messages.create.mockResolvedValue(mockCreatePrismaResponse as any);

      const result = await messagesRepository.create(createMessageDto);

      expect(prisma.messages.create).toHaveBeenCalledWith({
        data: {
          message: createMessageDto.message,
          sender: {
            connect: { id: createMessageDto.senderId },
          },
          chat: {
            connect: { id: createMessageDto.chatId },
          },
        },
        select: {
          id: true,
          chat_id: true,
          sender: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          message: true,
          created_at: true,
        },
      });
      expect(result).toEqual(mockCreatePrismaResponse);
    });
  });

  describe('findAll', () => {
    const mockCreatePrismaResponse = {
      id: 'messageId',
      message: 'some message',
      created_at: MOCK_DATE,
      sender: {
        id: MOCK_USER_ID,
        name: 'Username',
        surname: 'UserSurname',
      },
    };

    it('should return a list of messages starting from the cursor', async () => {
      const findAllMessagesDto = {
        chatId: 'chatId',
        take: 10,
        cursor: 'cursor',
      };

      prisma.messages.findMany.mockResolvedValue([
        mockCreatePrismaResponse as any,
      ]);

      const result = await messagesRepository.findAll(findAllMessagesDto);

      expect(prisma.messages.findMany).toHaveBeenCalledWith({
        where: { chat_id: findAllMessagesDto.chatId },
        select: {
          id: true,
          sender: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          message: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: findAllMessagesDto.take + 1,
        skip: 1,
        cursor: { id: findAllMessagesDto.cursor },
      });
      expect(result).toEqual([mockCreatePrismaResponse]);
    });

    it('should return a list of messages starting from the beginning', async () => {
      const findAllMessagesDto = {
        chatId: 'chatId',
        take: 10,
      };

      prisma.messages.findMany.mockResolvedValue([
        mockCreatePrismaResponse as any,
      ]);

      const result = await messagesRepository.findAll(findAllMessagesDto);

      expect(prisma.messages.findMany).toHaveBeenCalledWith({
        where: { chat_id: findAllMessagesDto.chatId },
        select: {
          id: true,
          sender: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          message: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: findAllMessagesDto.take + 1,
      });
      expect(result).toEqual([mockCreatePrismaResponse]);
    });
  });

  describe('update', () => {
    it('should update a message if it exists', async () => {
      const messageId = 'messageId';
      const updateMessageDto = {
        message: 'edited message',
      };
      const mockUpdatePrismaResponse = {
        id: messageId,
        chat_id: 'chatId',
        message: updateMessageDto.message,
        created_at: MOCK_DATE,
        sender: {
          id: 'senderId',
          name: 'Username',
          surname: 'UserSurname',
        },
      };

      prisma.messages.update.mockResolvedValue(mockUpdatePrismaResponse as any);

      const result = await messagesRepository.update(
        messageId,
        updateMessageDto,
      );

      expect(prisma.messages.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          message: updateMessageDto.message,
        },
        select: {
          id: true,
          chat_id: true,
          sender: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          message: true,
          created_at: true,
        },
      });
      expect(result).toEqual(mockUpdatePrismaResponse);
    });
    it('should throw an error if the message does not exist', async () => {
      const messageId = 'someId';
      const updateMessageDto = {
        message: 'edited message',
      };

      prisma.messages.update.mockRejectedValue(new Error('Prisma error'));

      await expect(
        messagesRepository.update(messageId, updateMessageDto),
      ).rejects.toThrow(new NotFoundException('Message not found'));
    });
  });

  describe('remove', () => {
    it('should remove a message if it exists', async () => {
      const messageId = 'messageId';
      const mockRemovePrismaResponse = {
        id: messageId,
        chat_id: 'chatId',
        message: 'some message',
        created_at: MOCK_DATE,
        sender: {
          id: 'senderId',
          name: 'Username',
          surname: 'UserSurname',
        },
      };

      prisma.messages.delete.mockResolvedValue(mockRemovePrismaResponse as any);

      const result = await messagesRepository.remove(messageId);

      expect(prisma.messages.delete).toHaveBeenCalledWith({
        where: { id: messageId },
        select: {
          id: true,
          chat_id: true,
          sender: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          message: true,
          created_at: true,
        },
      });
      expect(result).toEqual(mockRemovePrismaResponse);
    });

    it('should not throw an error if the message does not exist', async () => {
      const messageId = 'someId';

      prisma.messages.delete.mockRejectedValue(new Error('Prisma error'));

      await expect(
        messagesRepository.remove(messageId),
      ).resolves.toBeUndefined();
    });
  });
});
