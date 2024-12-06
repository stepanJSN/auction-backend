import { Injectable } from '@nestjs/common';
import { EpisodesRepository } from './episodes.repository';
import { FindAllEpisodesDto } from './dto/find-all-episodes.dto';

@Injectable()
export class EpisodesService {
  constructor(private episodesRepository: EpisodesRepository) {}

  findAll(findAllEpisodesDto: FindAllEpisodesDto) {
    return this.episodesRepository.findAll(findAllEpisodesDto);
  }
}
