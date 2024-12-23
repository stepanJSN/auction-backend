import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllCardsType } from './types/find-all-cards.type';
import { CreateCardType } from './types/create-card.type';
import { UpdateCardType } from './types/update-card.type';
import { CountNumberOfCardsType } from './types/count-number-of-cards.type';

@Injectable()
export class CardsRepository {
  constructor(private prisma: PrismaService) {}

  async create(createCard: CreateCardType) {
    const { id } = await this.prisma.cards.create({
      data: {
        name: createCard.name,
        type: createCard.type,
        gender: createCard.gender,
        image_url: createCard.imageUrl,
        is_created_by_admin: true,
        episodes: {
          connect: createCard.episodesId.map((episodeId) => ({
            id: episodeId,
          })),
        },
        location: {
          connect: {
            id: createCard.locationId,
          },
        },
      },
    });
    return id;
  }

  async findAll({
    active,
    isCreatedByAdmin,
    page,
    take,
    userId,
  }: FindAllCardsType) {
    return this.prisma.cards.findMany({
      where: {
        is_active: active,
        is_created_by_admin: isCreatedByAdmin,
        ...(userId && {
          card_instances: {
            some: {
              user_id: userId,
            },
          },
        }),
      },
      skip: (page - 1) * take,
      take,
    });
  }

  countNumberOfCards({
    active,
    isCreatedByAdmin,
    userId,
  }: CountNumberOfCardsType) {
    return this.prisma.cards.count({
      where: {
        is_active: active,
        is_created_by_admin: isCreatedByAdmin,
        ...(userId && {
          card_instances: {
            some: {
              user_id: userId,
            },
          },
        }),
      },
    });
  }

  findOneById(cardId: string, includeRelations = false) {
    return this.prisma.cards.findUnique({
      where: { id: cardId },
      include: {
        episodes: includeRelations,
        location: includeRelations,
      },
    });
  }

  update(cardId: string, updateCardData: UpdateCardType) {
    return this.prisma.cards.update({
      where: { id: cardId },
      data: {
        name: updateCardData.name,
        type: updateCardData.type,
        gender: updateCardData.gender,
        image_url: updateCardData.imageUrl,
        is_active: updateCardData.isActive,
        episodes: {
          set: updateCardData.episodesId?.map((episodeId) => ({
            id: episodeId,
          })),
        },
        location: updateCardData.locationId && {
          connect: { id: updateCardData.locationId },
        },
      },
    });
  }

  async delete(cardId: string) {
    try {
      return await this.prisma.cards.delete({ where: { id: cardId } });
    } catch {}
  }
}
