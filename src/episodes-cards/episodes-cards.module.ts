import { Module } from '@nestjs/common';
import { EpisodesCardsService } from './episodes-cards.service';
import { EpisodesCardsRepository } from './episodes-cards.repository';

@Module({
  providers: [EpisodesCardsService, EpisodesCardsRepository],
})
export class EpisodesCardsModule {}
