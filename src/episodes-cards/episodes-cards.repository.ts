import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEpisodeCardType } from './types/create-episode-card.type';

@Injectable()
export class EpisodesCardsRepository {
  constructor(private prisma: PrismaService) {}

  createMany(episodesCards: CreateEpisodeCardType[]) {
    return this.prisma.episodes_cards.createMany({ data: episodesCards });
  }

  deleteMany(cardId: string) {
    return this.prisma.episodes_cards.deleteMany({
      where: { card_id: cardId },
    });
  }
}
