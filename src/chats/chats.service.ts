import { Injectable } from '@nestjs/common';
import { ChatsRepository } from './chats.repository';
import { CreateMessageType } from './types/create-message.type';
import { UsersService } from 'src/users/users.service';
import { FindAllChatMessagesType } from './types/find-all-chat-messages.type';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
  ) {}
  create(createChat: CreateMessageType) {
    return this.chatsRepository.create(createChat);
  }

  async findAll(userId: string, page?: number, take?: number) {
    const { chats, totalCount } = await this.chatsRepository.findAll(
      userId,
      page,
      take,
    );
    const mappedChats = chats.map((chat) => {
      if (chat.sender.id === userId) {
        return {
          peer: {
            ...chat.receiver,
            type: 'receiver',
          },
          message: chat.message,
          createdAt: chat.created_at,
        };
      }
      return {
        peer: {
          ...chat.sender,
          type: 'sender',
        },
        message: chat.message,
        createdAt: chat.created_at,
      };
    });
    const uniqueChats = mappedChats.filter(
      (message1, i, chatsArr) =>
        chatsArr.findIndex(
          (message2) => message2.peer.id === message1.peer.id,
        ) === i,
    );
    return {
      data: uniqueChats,
      info: {
        page,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  async findAllChatMessages(findAllChatMessages: FindAllChatMessagesType) {
    const { id, name, surname } = await this.usersService.findOneById(
      findAllChatMessages.peerId,
    );
    const chat =
      await this.chatsRepository.findAllChatMessages(findAllChatMessages);
    return {
      peerData: { id, name, surname },
      messages: chat.messages,
      info: {
        page: findAllChatMessages.page,
        totalCount: chat.totalCount,
        totalPages: Math.ceil(chat.totalCount / findAllChatMessages.take),
      },
    };
  }

  update(id: string, message: string) {
    return this.chatsRepository.update(id, message);
  }

  remove(id: string) {
    return this.chatsRepository.remove(id);
  }
}
