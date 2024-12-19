import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageType } from './types/create-message.type';
import { FindAllMessagesOfChatDto } from './dto/find-all-messages-of-chat.dto';

@Injectable()
export class MessagesRepository {
  constructor(private prisma: PrismaService) {}
  create(createMessage: CreateMessageType) {
    return this.prisma.messages.create({
      data: {
        message: createMessage.message,
        sender: {
          connect: { id: createMessage.senderId },
        },
        chat: {
          connect: { id: createMessage.chatId },
        },
      },
    });
  }

  findAll({ chatId, take, cursor }: FindAllMessagesOfChatDto) {
    return this.prisma.messages.findMany({
      where: { chat_id: chatId },
      select: {
        id: true,
        sender: {
          select: {
            name: true,
            surname: true,
          },
        },
        message: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: take + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    try {
      return this.prisma.messages.update({
        where: { id },
        data: {
          message: updateMessageDto.message,
        },
      });
    } catch {
      throw new NotFoundException('Message not found');
    }
  }

  async remove(id: string) {
    try {
      return this.prisma.messages.delete({ where: { id } });
    } catch {}
  }
}
