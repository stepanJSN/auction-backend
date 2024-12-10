import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllCardsType } from './types/find-all-cards.type';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsRepository {
  constructor(private prisma: PrismaService) {}

  async create(createCard: CreateCardDto) {
    const { id } = await this.prisma.cards.create({
      data: {
        ...createCard,
        image_url: '',
        episodes: {
          connect: createCard.episodesId.map((episodeId) => ({
            id: episodeId,
          })),
        },
      },
    });
    return id;
  }

  async findAll({ active, isCreatedByAdmin, page, take }: FindAllCardsType) {
    const conditions = {
      is_active: active,
      is_created_by_admin: isCreatedByAdmin,
    };

    const [cards, totalCount] = await this.prisma.$transaction([
      this.prisma.cards.findMany({
        where: conditions,
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.cards.count({ where: conditions }),
    ]);
    return { cards, totalCount };
  }

  findOneById(cardId: string, includeEpisodes = false) {
    return this.prisma.cards.findUnique({
      where: { id: cardId },
      include: {
        episodes: includeEpisodes,
      },
    });
  }

  update(cardId: string, updateCardData: UpdateCardDto) {
    return this.prisma.cards.update({
      where: { id: cardId },
      data: {
        ...updateCardData,
        episodes: {
          set: updateCardData.episodesId.map((episodeId) => ({
            id: episodeId,
          })),
        },
      },
    });
  }

  delete(cardId: string) {
    return this.prisma.cards.delete({ where: { id: cardId } });
  }
}
