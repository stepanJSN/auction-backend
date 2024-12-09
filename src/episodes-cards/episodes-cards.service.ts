import { Injectable } from '@nestjs/common';
import { EpisodesCardsRepository } from './episodes-cards.repository';

@Injectable()
export class EpisodesCardsService {
  constructor(private episodesCardsRepository: EpisodesCardsRepository) {}

  async create(cardId: string, episodesId: number[]) {
    const episodesCards = episodesId.map((episodeId) => ({
      card_id: cardId,
      episode_id: episodeId,
    }));

    await this.episodesCardsRepository.createMany(episodesCards);
    return true;
  }

  async update(cardId: string, episodesId: number[]) {
    await this.episodesCardsRepository.deleteMany(cardId);

    const episodesCards = episodesId.map((episodeId) => ({
      card_id: cardId,
      episode_id: episodeId,
    }));

    await this.episodesCardsRepository.createMany(episodesCards);
    return true;
  }
}
