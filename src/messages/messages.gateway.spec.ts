import { Server } from 'socket.io';
import { MessagesGateway } from './messages.gateway';
import { Test } from '@nestjs/testing';
import { MOCK_DATE, MOCK_USER_ID } from 'config/mock-test-data';
import { MessagesWsOutgoingEventsEnum } from './enums/messages-ws-events.enum';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  })),
}));

describe('MessagesGateway', () => {
  let messagesGateway: MessagesGateway;
  let mockServer: jest.Mocked<Partial<Server>>;
  const chatId = 'chat123';
  const message = {
    id: 'messageId',
    chat_id: chatId,
    message: 'test message',
    created_at: MOCK_DATE,
    sender: {
      id: MOCK_USER_ID,
      name: 'User1',
      surname: 'User2',
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MessagesGateway, JwtService, ConfigService],
    }).compile();

    messagesGateway = module.get(MessagesGateway);
    mockServer = new Server() as unknown as jest.Mocked<Partial<Server>>;
    (messagesGateway as any).server = mockServer;
  });

  describe('newMessage', () => {
    it('should emit NEW event', () => {
      messagesGateway.newMessage(chatId, message);
      expect(mockServer.to).toHaveBeenCalledWith(chatId);
      expect(mockServer.emit).toHaveBeenCalledWith(
        MessagesWsOutgoingEventsEnum.NEW,
        message,
      );
    });
  });

  describe('editMessage', () => {
    it('should emit UPDATED event', () => {
      messagesGateway.editMessage(chatId, message);
      expect(mockServer.to).toHaveBeenCalledWith(chatId);
      expect(mockServer.emit).toHaveBeenCalledWith(
        MessagesWsOutgoingEventsEnum.UPDATED,
        message,
      );
    });
  });

  describe('remove', () => {
    it('should emit DELETED event', () => {
      messagesGateway.remove(chatId, message.id);
      expect(mockServer.to).toHaveBeenCalledWith(chatId);
      expect(mockServer.emit).toHaveBeenCalledWith(
        MessagesWsOutgoingEventsEnum.DELETED,
        { chat_id: chatId, id: message.id },
      );
    });
  });
});
