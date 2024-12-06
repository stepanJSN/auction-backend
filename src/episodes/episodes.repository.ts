import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllEpisodesDto } from './dto/find-all-episodes.dto';

@Injectable()
export class EpisodesRepository {
  constructor(private prisma: PrismaService) {}

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
}
