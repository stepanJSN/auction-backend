import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageType } from './types/create-message.type';

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
