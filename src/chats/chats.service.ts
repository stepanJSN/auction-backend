import { Injectable } from '@nestjs/common';
import { ChatsRepository } from './chats.repository';
import { CreateChatType } from './types/create-chat.type';
import { UpdateChatDto } from './dto/update-chat.dto';
import { WsException } from '@nestjs/websockets';
import { FindAllChatsType } from './types/find-all-chats.type';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}
  async create(createChat: CreateChatType) {
    const participantsWithCreator = [
      createChat.userId,
      ...createChat.participants,
    ];
    if (participantsWithCreator.length === 2) {
      const existingChats = await this.chatsRepository.findAllChatsWithUsers(
        participantsWithCreator[0],
        participantsWithCreator[1],
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
    return this.chatsRepository.create({
      participants: participantsWithCreator,
    });
  }

  async findAll(findAllChats: FindAllChatsType) {
    const { chats, totalCount } =
      await this.chatsRepository.findAll(findAllChats);
    return {
      data: chats,
      info: {
        page: findAllChats.page ?? 1,
        totalCount,
        totalPages: Math.ceil(totalCount / (findAllChats.take ?? 10)),
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
