import { BadRequestException, Injectable } from '@nestjs/common';
import { EpisodesRepository } from './episodes.repository';
import { FindAllEpisodesDto } from './dto/find-all-episodes.dto';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Injectable()
export class EpisodesService {
  constructor(private episodesRepository: EpisodesRepository) {}

  private async checkEpisodeName(name: string) {
    const locations = await this.findAll({ name });
    if (locations) {
      throw new BadRequestException('Episode with this name already exists');
    }
  }

  async create(createEpisodeDto: CreateEpisodeDto) {
    await this.checkEpisodeName(createEpisodeDto.name);

    return this.episodesRepository.create(createEpisodeDto);
  }

  async findAll(findAllEpisodesDto: FindAllEpisodesDto) {
    const { episodes, totalCount } =
      await this.episodesRepository.findAll(findAllEpisodesDto);
    return {
      data: episodes,
      info: {
        page: findAllEpisodesDto.page,
        totalCount,
        totalPages: Math.ceil(totalCount / findAllEpisodesDto.take),
      },
    };
  }

  async findOne(id: number) {
    const episode = await this.episodesRepository.findOne(id);
    if (!episode) {
      throw new BadRequestException('Episode not found');
    }

    return episode;
  }

  async update(id: number, updateLocationDto: UpdateEpisodeDto) {
    await this.findOne(id);
    await this.checkEpisodeName(updateLocationDto.name);
    return this.episodesRepository.update(id, updateLocationDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.episodesRepository.delete(id);
  }
}
