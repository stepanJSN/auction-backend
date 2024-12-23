import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EpisodesRepository } from './episodes.repository';
import { FindAllEpisodesDto } from './dto/find-all-episodes.dto';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Injectable()
export class EpisodesService {
  constructor(private episodesRepository: EpisodesRepository) {}

  private async checkEpisodeName(name: string) {
    const { episodes } = await this.episodesRepository.findAll({ name });
    if (episodes.length > 0) {
      throw new ConflictException('Episode with this name already exists');
    }
  }

  async create(createEpisodeDto: CreateEpisodeDto) {
    await this.checkEpisodeName(createEpisodeDto.name);

    return this.episodesRepository.create(createEpisodeDto);
  }

  async findAll({
    page = 1,
    take = 10,
    ...findAllEpisodesDto
  }: FindAllEpisodesDto) {
    const { episodes, totalCount } = await this.episodesRepository.findAll({
      ...findAllEpisodesDto,
      page,
      take,
    });
    return {
      data: episodes,
      info: {
        page,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  async findOne(id: number) {
    const episode = await this.episodesRepository.findOne(id);
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    return episode;
  }

  async update(id: number, updateLocationDto: UpdateEpisodeDto) {
    await this.checkEpisodeName(updateLocationDto.name);
    return this.episodesRepository.update(id, updateLocationDto);
  }

  async remove(id: number) {
    return this.episodesRepository.delete(id);
  }
}
