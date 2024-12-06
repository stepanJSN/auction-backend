import { Module } from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { EpisodesController } from './episodes.controller';
import { EpisodesRepository } from './episodes.repository';

@Module({
  controllers: [EpisodesController],
  providers: [EpisodesService, EpisodesRepository],
})
export class EpisodesModule {}
