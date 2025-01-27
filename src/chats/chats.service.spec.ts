import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ChatsGateway } from './chats.gateway';
import { ChatsRepository } from './chats.repository';
import { ChatsService } from './chats.service';
import { Test } from '@nestjs/testing';
import {
  MOCK_DATE,
  MOCK_ID,
  MOCK_USER2_ID,
  MOCK_USER_ID,
} from 'config/mock-test-data';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('ChatsService', () => {
  let chatsService: ChatsService;
  let chatsGateway: DeepMockProxy<ChatsGateway>;
  let chatsRepository: DeepMockProxy<ChatsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ChatsService,
        { provide: ChatsGateway, useValue: mockDeep<ChatsGateway>() },
        { provide: ChatsRepository, useValue: mockDeep<ChatsRepository>() },
      ],
    }).compile();

    chatsService = module.get(ChatsService);
    chatsGateway = module.get(ChatsGateway);
    chatsRepository = module.get(ChatsRepository);
  });

  describe('create', () => {
    it('should throw an ConflictException if chat already exists', async () => {
      const createChatPayload = {
        name: 'Test Chat',
        participants: [MOCK_USER_ID],
        userId: 'thisUserId',
      };
      const mockAllChatsWithUsers = [
        {
          id: MOCK_ID,
          users: [{ id: MOCK_USER_ID }, { id: createChatPayload.userId }],
        },
      ];
      chatsRepository.findAllChatsWithUsers.mockResolvedValueOnce(
        mockAllChatsWithUsers,
      );

      await expect(chatsService.create(createChatPayload)).rejects.toThrow(
        new ConflictException({
          id: mockAllChatsWithUsers[0].id,
          message: 'Chat already exists',
        }),
      );
    });

    it('should throw an BadRequestException if chat with more than 2 participants does not have a name', async () => {
      const createChatPayload = {
        participants: [MOCK_USER_ID, MOCK_USER2_ID],
        userId: 'thisUserId',
      };

      await expect(chatsService.create(createChatPayload)).rejects.toThrow(
        new BadRequestException(
          'Chat with more than 2 participants should have name',
        ),
      );
    });

    it('should create a chat', async () => {
      const createChatPayload = {
        participants: [MOCK_USER_ID, MOCK_USER2_ID],
        userId: MOCK_USER_ID,
      };
      const mockCreateChatResponse = {
        id: MOCK_ID,
        users: [
          {
            id: MOCK_USER_ID,
            name: 'User1',
            surname: 'User1Surname',
          },
          {
            id: MOCK_USER2_ID,
            name: 'User2',
            surname: 'User2Surname',
          },
        ],
      };

      chatsRepository.findAllChatsWithUsers.mockResolvedValueOnce([]);
      chatsRepository.create.mockResolvedValueOnce(
        mockCreateChatResponse as any,
      );

      const result = await chatsService.create(createChatPayload);

      expect(chatsRepository.findAllChatsWithUsers).toHaveBeenCalledTimes(1);
      expect(chatsRepository.findAllChatsWithUsers).toHaveBeenCalledWith(
        createChatPayload.participants[0],
        createChatPayload.participants[1],
      );
      expect(chatsRepository.create).toHaveBeenCalledTimes(1);
      expect(chatsRepository.create).toHaveBeenCalledWith({
        participants: createChatPayload.participants,
      });
      expect(chatsGateway.create).toHaveBeenCalledTimes(1);
      const expectedChatName = `${mockCreateChatResponse.users[1].name} ${mockCreateChatResponse.users[1].surname}`;
      expect(chatsGateway.create).toHaveBeenCalledWith(
        mockCreateChatResponse.id,
        createChatPayload.participants,
        expectedChatName,
      );
      expect(result).toEqual(mockCreateChatResponse);
    });
  });

  describe('findAll', () => {
    it('should find all chats', async () => {
      const mockFindAllChatsResponse = [
        {
          id: MOCK_ID,
          name: 'Test Chat',
          users: [
            {
              id: MOCK_USER_ID,
              name: 'User1',
              surname: 'User1Surname',
            },
            {
              id: MOCK_USER2_ID,
              name: 'User2',
              surname: 'User2Surname',
            },
          ],
          messages: [
            {
              id: 'messageId',
              created_at: MOCK_DATE,
              message: 'some message',
              sender: {
                id: MOCK_USER2_ID,
                name: 'User2',
                surname: 'User2Surname',
              },
            },
          ],
        },
      ];
      const findAllChatsPayload = {
        page: 1,
        take: 10,
        userId: MOCK_USER_ID,
      };

      chatsRepository.findAll.mockResolvedValueOnce({
        chats: mockFindAllChatsResponse,
        totalCount: 1,
      });

      const result = await chatsService.findAll(findAllChatsPayload);

      expect(chatsRepository.findAll).toHaveBeenCalledTimes(1);
      expect(chatsRepository.findAll).toHaveBeenCalledWith(findAllChatsPayload);
      expect(result).toEqual({
        data: [
          {
            id: mockFindAllChatsResponse[0].id,
            name: mockFindAllChatsResponse[0].name,
            lastMessage: {
              id: mockFindAllChatsResponse[0].messages[0].id,
              message: mockFindAllChatsResponse[0].messages[0].message,
              created_at: mockFindAllChatsResponse[0].messages[0].created_at,
              sender: {
                name: mockFindAllChatsResponse[0].messages[0].sender.name,
                surname: mockFindAllChatsResponse[0].messages[0].sender.surname,
                is_this_user_message: false,
              },
            },
          },
        ],
        info: {
          page: findAllChatsPayload.page,
          totalCount: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should throw an NotFoundException if chat does not exist', async () => {
      chatsRepository.findOne.mockResolvedValueOnce(null);

      await expect(chatsService.findOne(MOCK_ID, MOCK_USER_ID)).rejects.toThrow(
        new NotFoundException('Chat not found'),
      );
    });

    it('should find one chat', async () => {
      const mockFindOneChatResponse = {
        id: MOCK_ID,
        name: 'Test Chat',
        users: [
          {
            id: MOCK_USER_ID,
            name: 'User1',
            surname: 'User1Surname',
          },
          {
            id: MOCK_USER2_ID,
            name: 'User2',
            surname: 'User2Surname',
          },
        ],
      };

      chatsRepository.findOne.mockResolvedValueOnce(mockFindOneChatResponse);

      const result = await chatsService.findOne(MOCK_ID, MOCK_USER_ID);

      expect(chatsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(chatsRepository.findOne).toHaveBeenCalledWith(MOCK_ID);
      expect(result).toEqual(mockFindOneChatResponse);
    });
  });

  describe('update', () => {
    it('should update a chat', async () => {
      const newChatData = {
        participants: [MOCK_USER_ID, MOCK_USER2_ID],
      };

      const mockUpdateChatResponse = {
        id: MOCK_ID,
        name: 'Test Chat',
        users: [
          {
            id: MOCK_USER_ID,
            name: 'User1',
            surname: 'User1Surname',
          },
          {
            id: MOCK_USER2_ID,
            name: 'User2',
            surname: 'User2Surname',
          },
        ],
      };

      chatsRepository.update.mockResolvedValueOnce(mockUpdateChatResponse);
      chatsRepository.findAllChatsWithUsers.mockResolvedValueOnce([]);

      const result = await chatsService.update(
        MOCK_ID,
        newChatData,
        MOCK_USER_ID,
      );

      expect(chatsRepository.findAllChatsWithUsers).toHaveBeenCalledTimes(1);
      expect(chatsRepository.findAllChatsWithUsers).toHaveBeenCalledWith(
        newChatData.participants[0],
        newChatData.participants[1],
      );
      expect(chatsRepository.update).toHaveBeenCalledTimes(1);
      expect(chatsRepository.update).toHaveBeenCalledWith(MOCK_ID, newChatData);
      expect(result).toEqual(mockUpdateChatResponse);
    });
  });

  describe('remove', () => {
    it('should remove a chat', async () => {
      await chatsService.remove(MOCK_ID);
      expect(chatsRepository.remove).toHaveBeenCalledTimes(1);
      expect(chatsRepository.remove).toHaveBeenCalledWith(MOCK_ID);
      expect(chatsGateway.remove).toHaveBeenCalledTimes(1);
      expect(chatsGateway.remove).toHaveBeenCalledWith(MOCK_ID);
    });
  });
});
