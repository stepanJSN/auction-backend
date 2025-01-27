import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ChatsGateway } from './chats.gateway';
import { ChatsRepository } from './chats.repository';
import { ChatsService } from './chats.service';
import { Test } from '@nestjs/testing';
import { MOCK_ID, MOCK_USER2_ID, MOCK_USER_ID } from 'config/mock-test-data';
import { BadRequestException, ConflictException } from '@nestjs/common';

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
});
