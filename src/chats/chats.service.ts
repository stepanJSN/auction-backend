import { Injectable } from '@nestjs/common';
import { ChatsRepository } from './chats.repository';
import { CreateMessageType } from './types/create-message.type';
import { UpdateChatDto } from './dto/update-chat.dto';
import { WsException } from '@nestjs/websockets';
import { FindAllChatsType } from './types/find-all-chats.type';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}
  async create(createChat: CreateMessageType) {
    if (createChat.participants.length === 2) {
      const existingChats = await this.chatsRepository.findAllChatsWithUsers(
        createChat.participants[0],
        createChat.participants[1],
      );
      const existingPrivateChat = existingChats.find(
        (chat) => chat.users.length === 2,
      );
      if (existingPrivateChat) {
        throw new WsException({
          id: existingPrivateChat.id,
          message: 'Chat already exists',
        });
      }
    }
    return this.chatsRepository.create(createChat);
  }

  async findAll(findAllChats: FindAllChatsType) {
    const { chats, totalCount } =
      await this.chatsRepository.findAll(findAllChats);
    return {
      data: chats,
      info: {
        page: findAllChats.page,
        totalCount,
        totalPages: Math.ceil(totalCount / findAllChats.take),
      },
    };
  }

  update(updateChatDto: UpdateChatDto) {
    return this.chatsRepository.update(updateChatDto);
  }

  remove(id: string) {
    return this.chatsRepository.remove(id);
  }
}
