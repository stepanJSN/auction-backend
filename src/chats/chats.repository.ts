import { Injectable } from '@nestjs/common';
import { CreateMessageType } from './types/create-message.type';
import { PrismaService } from 'src/prisma/prisma.service';

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

  findAll(senderId: string) {
    return this.prisma.chats.findMany({
      where: {
        OR: [{ sender_id: senderId }, { receiver_id: senderId }],
      },
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
    });
  }

  findOne(user1: string, user2: string) {
    return this.prisma.chats.findMany({
      where: {
        OR: [
          {
            sender_id: user1,
            receiver_id: user2,
          },
          {
            sender_id: user2,
            receiver_id: user1,
          },
        ],
      },
    });
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
