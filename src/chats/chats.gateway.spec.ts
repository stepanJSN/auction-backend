import { Test } from '@nestjs/testing';
import { ChatsGateway } from './chats.gateway';
import { ChatsService } from './chats.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { Server, Socket } from 'socket.io';
import { ChatWsOutgoingEventsEnum } from './enums/chat-ws-events.enum';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { MOCK_DATE, MOCK_USER_ID } from 'config/mock-test-data';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.mock('socket.io');

describe('ChatsGateway', () => {
  let chatsGateway: ChatsGateway;
  let chatsService: DeepMockProxy<ChatsService>;
  let mockServer: Partial<Server>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      in: jest.fn().mockReturnThis(),
      socketsLeave: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        ChatsGateway,
        ConfigService,
        JwtService,
        {
          provide: ChatsService,
          useValue: mockDeep<ChatsService>(),
        },
        {
          provide: AuthGuard,
          useValue: {
            validateWsRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    chatsGateway = module.get(ChatsGateway);
    chatsService = module.get(ChatsService);
    Object.defineProperty(chatsGateway, 'server', {
      value: mockServer,
    });
  });

  describe('handleConnection', () => {
    it('should validate connection and join user to chat rooms', async () => {
      const client = {
        join: jest.fn(),
      } as unknown as Socket;
      const mockFindAllChatsResponse = [
        {
          id: 'chat1',
          name: 'Test Chat',
          lastMessage: {
            id: 'messageId',
            message: 'someMessage',
            created_at: MOCK_DATE,
            sender: {
              name: 'mockUserName',
              surname: 'mockUserSurname',
              is_this_user_message: false,
            },
          },
        },
        {
          id: 'chat2',
          name: 'Test Chat 2',
          lastMessage: {
            id: 'messageId',
            message: 'someMessage',
            created_at: MOCK_DATE,
            sender: {
              name: 'mockUserName',
              surname: 'mockUserSurname',
              is_this_user_message: false,
            },
          },
        },
      ];

      client['user'] = { id: MOCK_USER_ID };
      jest
        .spyOn(chatsGateway['authGuard'], 'validateWsRequest')
        .mockResolvedValue(false);
      chatsService.findAll.mockResolvedValue({
        data: mockFindAllChatsResponse,
        info: { page: 1, totalCount: 2, totalPages: 1 },
      });
      await chatsGateway.handleConnection(client);

      expect(chatsGateway['authGuard'].validateWsRequest).toHaveBeenCalled();
      expect(client.join).toHaveBeenCalledWith(mockFindAllChatsResponse[0].id);
      expect(client.join).toHaveBeenCalledWith(mockFindAllChatsResponse[1].id);
    });

    it('should disconnect client if validation fails', async () => {
      const client = { disconnect: jest.fn() } as unknown as Socket;
      jest
        .spyOn(chatsGateway['authGuard'], 'validateWsRequest')
        .mockRejectedValue(new Error());

      await chatsGateway.handleConnection(client);

      expect(chatsGateway['authGuard'].validateWsRequest).toHaveBeenCalled();
      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should emit DELETED event and make users leave the chat room', () => {
      const id = 'chat123';

      chatsGateway.remove(id);

      expect(chatsGateway.server.to).toHaveBeenCalledWith(id);
      expect(mockServer.emit).toHaveBeenCalledWith(
        ChatWsOutgoingEventsEnum.DELETED,
        id,
      );
      expect(mockServer.in).toHaveBeenCalledWith(id);
      expect(mockServer.in(id).socketsLeave).toHaveBeenCalledWith(id);
    });
  });
});
