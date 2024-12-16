import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll({ name, page = 1, take = 10 }: FindAllEpisodesDto) {
    const conditions = {
      name: {
        contains: name,
      },
    };
    const [episodes, totalCount] = await this.prisma.$transaction([
      this.prisma.episodes.findMany({
        where: conditions,
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.episodes.count({ where: conditions }),
    ]);
    return { episodes, totalCount };
  }

  findOne(id: number) {
    return this.prisma.episodes.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateEpisodeDto: UpdateEpisodeDto) {
    try {
      return await this.prisma.episodes.update({
        where: { id },
        data: updateEpisodeDto,
      });
    } catch {
      throw new NotFoundException('Episode not found');
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.episodes.delete({ where: { id } });
    } catch {}
  }
}
