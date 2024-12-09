import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllEpisodesDto } from './dto/find-all-episodes.dto';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Injectable()
export class EpisodesRepository {
  constructor(private prisma: PrismaService) {}

  create(createEpisodeDto: CreateEpisodeDto) {
    return this.prisma.episodes.create({
      data: createEpisodeDto,
    });
  }

  findAll({ name, page = 1, take = 10 }: FindAllEpisodesDto) {
    return this.prisma.episodes.findMany({
      where: {
        name: {
          contains: name,
        },
      },
      skip: (page - 1) * take,
      take,
    });
  }

  findOne(id: number) {
    return this.prisma.episodes.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: number, updateEpisodeDto: UpdateEpisodeDto) {
    return this.prisma.episodes.update({
      where: { id },
      data: updateEpisodeDto,
    });
  }

  delete(id: number) {
    return this.prisma.episodes.delete({ where: { id } });
  }
}
