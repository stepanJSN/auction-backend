import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { MessagesService } from 'src/messages/messages.service';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { Test } from '@nestjs/testing';
import { MOCK_USER2_ID, MOCK_USER_ID } from 'config/mock-test-data';

describe('ChatsController', () => {
  let chatsController: ChatsController;
  let chatsService: DeepMockProxy<ChatsService>;
  let messagesService: DeepMockProxy<MessagesService>;
  const chatId = 'testChatId';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ChatsController],
      providers: [
        { provide: ChatsService, useValue: mockDeep<ChatsService>() },
        { provide: MessagesService, useValue: mockDeep<MessagesService>() },
      ],
    }).compile();

    chatsService = module.get(ChatsService);
    messagesService = module.get(MessagesService);
    chatsController = module.get(ChatsController);
  });

  describe('create chat', () => {
    it('should create a chat', () => {
      const createChatDto = {
        name: 'Test Chat',
        participants: [MOCK_USER2_ID],
      };
      chatsController.create(createChatDto, MOCK_USER_ID);
      expect(chatsService.create).toHaveBeenCalledWith({
        name: createChatDto.name,
        participants: createChatDto.participants,
        userId: MOCK_USER_ID,
      });
    });
  });

  describe('create message', () => {
    it('should create a message', () => {
      const createMessageDto = {
        message: 'Test Message',
      };

      chatsController.createMessage(chatId, createMessageDto, MOCK_USER_ID);
      expect(messagesService.create).toHaveBeenCalledWith({
        ...createMessageDto,
        chatId,
        senderId: MOCK_USER_ID,
      });
    });
  });

  describe('find all chats', () => {
    it('should find all chats', () => {
      const findAllChatsDto = {
        name: 'Test Chat',
        page: 1,
        take: 15,
      };

      chatsController.findAll(findAllChatsDto, MOCK_USER_ID);
      expect(chatsService.findAll).toHaveBeenCalledWith({
        userId: MOCK_USER_ID,
        name: findAllChatsDto.name,
        page: findAllChatsDto.page,
        take: findAllChatsDto.take,
      });
    });
  });

  describe('find one chat', () => {
    it('should find one chat', () => {
      chatsController.findOne(chatId, MOCK_USER_ID);
      expect(chatsService.findOne).toHaveBeenCalledWith(chatId, MOCK_USER_ID);
    });
  });

  describe('find all messages', () => {
    it('should find all messages', () => {
      const findAllMessagesDto = {
        take: 15,
        cursor: 'testCursor',
      };

      chatsController.findAllMessages(chatId, findAllMessagesDto, MOCK_USER_ID);
      expect(messagesService.findAll).toHaveBeenCalledWith({
        chatId,
        take: findAllMessagesDto.take,
        cursor: findAllMessagesDto.cursor,
        userId: MOCK_USER_ID,
      });
    });
  });

  describe('update chat', () => {
    it('should update a chat', () => {
      const updateChatDto = {
        name: 'Test Chat',
        participants: [MOCK_USER2_ID, 'anotherParticipant'],
      };
      chatsController.update(chatId, updateChatDto, MOCK_USER_ID);
      expect(chatsService.update).toHaveBeenCalledWith(
        chatId,
        updateChatDto,
        MOCK_USER_ID,
      );
    });
  });

  describe('update message', () => {
    it('should update a message', () => {
      const updateMessageDto = {
        message: 'Test Message',
      };
      const messageId = 'messageId';
      chatsController.updateMessage(messageId, updateMessageDto);
      expect(messagesService.update).toHaveBeenCalledWith(
        messageId,
        updateMessageDto,
      );
    });
  });

  describe('remove chat', () => {
    it('should remove a chat', () => {
      chatsController.remove(chatId);
      expect(chatsService.remove).toHaveBeenCalledWith(chatId);
    });
  });

  describe('remove message', () => {
    it('should remove a message', () => {
      const messageId = 'messageId';
      chatsController.removeMessage(messageId);
      expect(messagesService.remove).toHaveBeenCalledWith(messageId);
    });
  });
});
