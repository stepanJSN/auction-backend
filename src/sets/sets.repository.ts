import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSetDto } from './dto/create-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';

@Injectable()
export class SetsRepository {
  constructor(private prisma: PrismaService) {}

  create({ name, bonus, cardsId }: CreateSetDto) {
    return this.prisma.sets.create({
      data: {
        name,
        bonus,
        cards: {
          connect: cardsId.map((cardId) => ({ id: cardId })),
        },
      },
    });
  }

  async findAll(page = 1, take = 10) {
    const [sets, totalCount] = await this.prisma.$transaction([
      this.prisma.sets.findMany({
        skip: (page - 1) * take,
        take,
        include: {
          cards: true,
        },
      }),
      this.prisma.cards.count(),
    ]);
    return { sets, totalCount };
  }

  findOne(id: string) {
    return this.prisma.sets.findUnique({
      where: { id },
      include: {
        cards: true,
      },
    });
  }

  update(id: string, { name, bonus, cardsId }: UpdateSetDto) {
    return this.prisma.sets.update({
      where: { id },
      data: {
        name,
        bonus,
        cards: {
          set: cardsId.map((cardId) => ({ id: cardId })),
        },
      },
    });
  }

  remove(id: string) {
    return this.prisma.sets.delete({ where: { id } });
  }
}
