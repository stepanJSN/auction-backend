import { Injectable } from '@nestjs/common';
import { CreateMessageType } from './types/create-message.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateMessageDto } from './dto/update-message.dto';

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
      take: 1,
    });
  }

  findOne(senderId: string, receiverId: string) {
    return this.prisma.chats.findMany({
      where: {
        OR: [
          {
            sender_id: senderId,
            receiver_id: receiverId,
          },
          {
            sender_id: receiverId,
            receiver_id: senderId,
          },
        ],
      },
    });
  }

  update(id: string, updateMessageDto: UpdateMessageDto) {
    return this.prisma.chats.update({
      where: { id },
      data: updateMessageDto,
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.chats.delete({ where: { id } });
    } catch {}
  }
}
