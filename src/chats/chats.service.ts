import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ChatsRepository } from './chats.repository';
import { CreateChatType } from './types/create-chat.type';
import { UpdateChatDto } from './dto/update-chat.dto';
import { FindAllChatsType } from './types/find-all-chats.type';
import { ChatsGateway } from './chats.gateway';
import { ChatType } from './types/chat.type';
import { MessageType } from './types/message.type';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    @Inject(forwardRef(() => ChatsGateway))
    private chatsGateway: ChatsGateway,
  ) {}
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
        throw new BadRequestException({
          id: existingPrivateChat.id,
          message: 'Chat already exists',
        });
      }
    }

    if (participantsWithCreator.length > 2 && !createChat.name) {
      throw new BadRequestException(
        'Chat with more than 2 participants should have name',
      );
    }

    const chat = await this.chatsRepository.create({
      name: createChat.name,
      participants: participantsWithCreator,
    });

    this.chatsGateway.create(chat.id, participantsWithCreator);

    return chat;
  }

  private formatChatName(chat: ChatType, userId: string): string {
    if (chat.name) return chat.name;

    const otherUser = chat.users.find((user) => user.id !== userId);
    return `${otherUser.name} ${otherUser.surname}`;
  }

  private formatLastMessage(message: MessageType, userId: string) {
    return {
      sender: {
        name: message.sender.name,
        surname: message.sender.surname,
        is_this_user_message: message.sender.id === userId,
      },
      id: message.id,
      message: message.message,
      created_at: message.created_at,
    };
  }

  async findAll(findAllChats: FindAllChatsType) {
    const { chats, totalCount } =
      await this.chatsRepository.findAll(findAllChats);

    const formattedChats = chats.map((chat) => ({
      id: chat.id,
      name: this.formatChatName(chat, findAllChats.userId),
      lastMessage: chat.messages.length
        ? this.formatLastMessage(chat.messages[0], findAllChats.userId)
        : null,
    }));

    return {
      data: formattedChats,
      info: {
        page: findAllChats.page,
        totalCount,
        totalPages: Math.ceil(totalCount / findAllChats.take),
      },
    };
  }

  update(id: string, updateChatDto: UpdateChatDto) {
    return this.chatsRepository.update(id, updateChatDto);
  }

  async remove(id: string) {
    await this.chatsRepository.remove(id);
    this.chatsGateway.remove(id);
  }
}
