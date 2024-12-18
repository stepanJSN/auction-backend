import { Injectable } from '@nestjs/common';
import { CreateMessageType } from './types/create-message.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllChatMessagesType } from './types/find-all-chat-messages.type';

@Injectable()
export class ChatsRepository {
  constructor(private prisma: PrismaService) {}
  create(createMessage: CreateMessageType) {
    return this.prisma.chats.create({
      data: {
        message: createMessage.message,
        sender: {
          connect: { id: createMessage.senderId },
        },
        receiver: {
          connect: { id: createMessage.receiverId },
        },
      },
    });
  }

  async findAll(senderId: string, page?: number, take?: number) {
    const conditions = {
      OR: [{ sender_id: senderId }, { receiver_id: senderId }],
    };
    const [chats, totalCount] = await this.prisma.$transaction([
      this.prisma.chats.findMany({
        where: conditions,
        orderBy: {
          created_at: 'desc',
        },
        distinct: ['sender_id', 'receiver_id'],
        select: {
          message: true,
          created_at: true,
          sender: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
        },
        skip: take ? (page - 1) * take : 0,
        take,
      }),
      this.prisma.chats.count({ where: conditions }),
    ]);
    return { chats, totalCount };
  }

  async findAllChatMessages({
    thisUserId,
    peerId,
    page,
    take,
  }: FindAllChatMessagesType) {
    const conditions = {
      OR: [
        {
          sender_id: thisUserId,
          receiver_id: peerId,
        },
        {
          sender_id: peerId,
          receiver_id: thisUserId,
        },
      ],
    };
    const [messages, totalCount] = await this.prisma.$transaction([
      this.prisma.chats.findMany({
        where: conditions,
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.chats.count({ where: conditions }),
    ]);
    return { messages, totalCount };
  }

  update(id: string, message: string) {
    return this.prisma.chats.update({
      where: { id },
      data: {
        message,
      },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.chats.delete({ where: { id } });
    } catch {}
  }
}
