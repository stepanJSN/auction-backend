import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { MessagesGateway } from './messages.gateway';
import { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';
import { Test } from '@nestjs/testing';
import { MOCK_DATE, MOCK_USER2_ID, MOCK_USER_ID } from 'config/mock-test-data';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let messagesRepository: DeepMockProxy<MessagesRepository>;
  let messagesGateway: DeepMockProxy<MessagesGateway>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: MessagesRepository,
          useValue: mockDeep<MessagesRepository>(),
        },
        { provide: MessagesGateway, useValue: mockDeep<MessagesGateway>() },
      ],
    }).compile();

    messagesService = module.get(MessagesService);
    messagesRepository = module.get(MessagesRepository);
    messagesGateway = module.get(MessagesGateway);
  });

  describe('create', () => {
    it('should create a message', async () => {
      const createMessageDto = {
        chatId: 'chatId',
        message: 'Hello',
        senderId: 'senderId',
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

      messagesRepository.create.mockResolvedValue(mockCreatePrismaResponse);
      const result = await messagesService.create(createMessageDto);

      expect(messagesRepository.create).toHaveBeenCalledWith(createMessageDto);
      expect(messagesGateway.newMessage).toHaveBeenCalledWith(
        createMessageDto.chatId,
        mockCreatePrismaResponse,
      );
      expect(result).toEqual({
        id: mockCreatePrismaResponse.id,
        message: mockCreatePrismaResponse.message,
        created_at: mockCreatePrismaResponse.created_at,
        sender: {
          name: mockCreatePrismaResponse.sender.name,
          surname: mockCreatePrismaResponse.sender.surname,
          is_this_user_message: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return a list of messages starting from the cursor', async () => {
      const findAllMessagesDto = {
        chatId: 'chatId',
        take: 10,
        cursor: 'cursor',
        userId: MOCK_USER_ID,
      };
      const mockFindAllPrismaResponse = [
        {
          id: 'messageId',
          message: 'message',
          created_at: MOCK_DATE,
          sender: {
            id: MOCK_USER_ID,
            name: 'User1',
            surname: 'User1Surname',
          },
        },
        {
          id: 'message2Id',
          message: 'another message',
          created_at: MOCK_DATE,
          sender: {
            id: MOCK_USER2_ID,
            name: 'User2',
            surname: 'User2Surname',
          },
        },
      ];

      messagesRepository.findAll.mockResolvedValue(mockFindAllPrismaResponse);
      const result = await messagesService.findAll(findAllMessagesDto);

      expect(messagesRepository.findAll).toHaveBeenCalledWith(
        findAllMessagesDto,
      );
      expect(result).toEqual({
        data: [
          {
            id: mockFindAllPrismaResponse[1].id,
            message: mockFindAllPrismaResponse[1].message,
            created_at: mockFindAllPrismaResponse[1].created_at,
            sender: {
              name: mockFindAllPrismaResponse[1].sender.name,
              surname: mockFindAllPrismaResponse[1].sender.surname,
              is_this_user_message: false,
            },
          },
          {
            id: mockFindAllPrismaResponse[0].id,
            message: mockFindAllPrismaResponse[0].message,
            created_at: mockFindAllPrismaResponse[0].created_at,
            sender: {
              name: mockFindAllPrismaResponse[0].sender.name,
              surname: mockFindAllPrismaResponse[0].sender.surname,
              is_this_user_message: true,
            },
          },
        ],
        pagination: {
          cursor: mockFindAllPrismaResponse[1].id,
          hasNextPage: false,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a message', async () => {
      const updateMessageDto = {
        message: 'updated message',
      };
      const messageId = 'messageId';
      const mockUpdatePrismaResponse = {
        id: messageId,
        chat_id: 'chatId',
        message: updateMessageDto.message,
        created_at: MOCK_DATE,
        sender: {
          id: MOCK_USER_ID,
          name: 'Username',
          surname: 'UserSurname',
        },
      };
      messagesRepository.update.mockResolvedValue(mockUpdatePrismaResponse);
      const result = await messagesService.update(messageId, updateMessageDto);

      expect(messagesRepository.update).toHaveBeenCalledWith(
        messageId,
        updateMessageDto,
      );
      expect(messagesGateway.editMessage).toHaveBeenCalledWith(
        mockUpdatePrismaResponse.chat_id,
        mockUpdatePrismaResponse,
      );
      expect(result).toEqual({
        id: mockUpdatePrismaResponse.id,
        message: mockUpdatePrismaResponse.message,
        created_at: mockUpdatePrismaResponse.created_at,
        sender: {
          name: mockUpdatePrismaResponse.sender.name,
          surname: mockUpdatePrismaResponse.sender.surname,
          is_this_user_message: true,
        },
      });
    });
  });

  describe('remove', () => {
    it('should remove a message', async () => {
      const messageId = 'messageId';
      const mockRemovePrismaResponse = {
        id: messageId,
        chat_id: 'chatId',
        message: 'message',
        created_at: MOCK_DATE,
        sender: {
          id: MOCK_USER_ID,
          name: 'Username',
          surname: 'UserSurname',
        },
      };
      messagesRepository.remove.mockResolvedValue(mockRemovePrismaResponse);
      await messagesService.remove(messageId);
    });
  });
});
