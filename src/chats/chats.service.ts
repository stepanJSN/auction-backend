import { Injectable } from '@nestjs/common';
import { ChatsRepository } from './chats.repository';
import { CreateMessageType } from './types/create-message.type';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
  ) {}
  create(createChat: CreateMessageType) {
    return this.chatsRepository.create(createChat);
  }

  async findAll(userId: string) {
    const chats = await this.chatsRepository.findAll(userId);
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
    return mappedChats.filter(
      (message1, i, chatsArr) =>
        chatsArr.findIndex(
          (message2) => message2.peer.id === message1.peer.id,
        ) === i,
    );
  }

  async findOne(thisUserId: string, peerId: string) {
    const { id, name, surname } = await this.usersService.findOneById(peerId);
    const chat = await this.chatsRepository.findOne(thisUserId, peerId);
    return {
      peerData: { id, name, surname },
      chat,
    };
  }

  update(id: string, message: string) {
    return this.chatsRepository.update(id, message);
  }

  remove(id: string) {
    return this.chatsRepository.remove(id);
  }
}
