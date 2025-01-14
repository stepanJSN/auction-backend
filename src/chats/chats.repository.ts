import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { FindAllChatsType } from './types/find-all-chats.type';

@Injectable()
export class ChatsRepository {
  constructor(private prisma: PrismaService) {}
  create({ participants, name }: CreateChatDto) {
    return this.prisma.chats.create({
      data: {
        name,
        users: {
          connect: participants.map((participant) => ({ id: participant })),
        },
      },
      select: {
        id: true,
        name: true,
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });
  }

  async findAll({ userId, page = 1, take = 10, name }: FindAllChatsType) {
    const conditions = {
      users: {
        some: {
          id: userId,
        },
      },
      OR: [
        {
          users: {
            some: {
              name: { contains: name },
            },
          },
        },
        {
          users: {
            some: {
              surname: { contains: name },
            },
          },
        },
        {
          users: {
            some: {
              AND: [
                { name: { contains: name?.split(' ')[0] } },
                {
                  surname: { contains: name?.split(' ')[1] || '' },
                },
              ],
            },
          },
        },
        { name: { contains: name } },
      ],
    };
    const [chats, totalCount] = await this.prisma.$transaction([
      this.prisma.chats.findMany({
        where: conditions,
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          users: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          name: true,
          messages: {
            select: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
              id: true,
              message: true,
              created_at: true,
            },
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
          },
        },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.chats.count({ where: conditions }),
    ]);
    return { chats, totalCount };
  }

  findOne(id: string) {
    return this.prisma.chats.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });
  }

  findAllChatsWithUsers(user1Id: string, user2Id: string) {
    return this.prisma.chats.findMany({
      where: {
        users: {
          every: {
            id: {
              in: [user1Id, user2Id],
            },
          },
        },
      },
      include: {
        users: true,
      },
    });
  }

  async update(id: string, { participants }: UpdateChatDto) {
    try {
      return await this.prisma.chats.update({
        where: { id },
        data: {
          users: {
            set: participants.map((participant) => ({ id: participant })),
          },
        },
      });
    } catch {
      throw new NotFoundException('Chat not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.chats.delete({ where: { id } });
    } catch {}
  }
}
