import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
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

  async checkChat(participants: string[], chatName: string) {
    if (participants.length === 2) {
      const existingChats = await this.chatsRepository.findAllChatsWithUsers(
        participants[0],
        participants[1],
      );
      const existingPrivateChat = existingChats.find(
        (chat) => chat.users.length === 2,
      );
      if (existingPrivateChat) {
        throw new ConflictException({
          id: existingPrivateChat.id,
          message: 'Chat already exists',
        });
      }
    }

    if (participants.length > 2 && !chatName) {
      throw new BadRequestException(
        'Chat with more than 2 participants should have name',
      );
    }
  }

  async create(createChat: CreateChatType) {
    const participantsWithCreator = Array.from(
      new Set([createChat.userId, ...createChat.participants]),
    );

    await this.checkChat(participantsWithCreator, createChat.name);

    const chat = await this.chatsRepository.create({
      name: createChat.name,
      participants: participantsWithCreator,
    });

    const newChatName = this.formatChatName(chat, createChat.userId);

    this.chatsGateway.create(chat.id, participantsWithCreator, newChatName);

    return chat;
  }

  private formatChatName(
    chat: Omit<ChatType, 'messages'>,
    userId: string,
  ): string {
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

  async findOne(chatId: string, userId: string) {
    const chat = await this.chatsRepository.findOne(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const chatName = this.formatChatName(chat, userId);

    return {
      ...chat,
      name: chatName,
    };
  }

  async update(id: string, updateChatDto: UpdateChatDto, userId: string) {
    await this.checkChat(updateChatDto.participants, updateChatDto.name);
    const chat = await this.chatsRepository.update(id, updateChatDto);
    const chatName = this.formatChatName(chat, userId);

    return {
      ...chat,
      name: chatName,
    };
  }

  async remove(id: string) {
    await this.chatsRepository.remove(id);
    this.chatsGateway.remove(id);
  }
}
