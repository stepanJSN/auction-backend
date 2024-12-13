import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSetDto } from './dto/create-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { SetsRepository } from './sets.repository';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { FindAllSetsServiceType } from './types/find-all-sets-serivce.type';
import { Role } from '@prisma/client';

@Injectable()
export class SetsService {
  constructor(
    private setsRepository: SetsRepository,
    private cardInstancesService: CardInstancesService,
  ) {}

  async create(createSetDto: CreateSetDto) {
    const { id } = await this.setsRepository.create(createSetDto);
    return id;
  }

  async findAll({ page = 1, take = 10, role, userId }: FindAllSetsServiceType) {
    const { sets, totalCount } = await this.setsRepository.findAll(page, take);
    const info = {
      page,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
    };
    if (role !== Role.User) {
      return { data: sets, info };
    }

    const mappedSets = await Promise.all(
      sets.map(async (set) => ({
        id: set.id,
        name: set.name,
        bonus: set.bonus,
        cards: await this.cardInstancesService.attachOwnershipFlag(
          set.cards,
          userId,
        ),
        createdAt: set.created_at,
      })),
    );
    return {
      data: mappedSets,
      info: {
        page,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  async findOne(id: string) {
    const set = await this.setsRepository.findOne(id);
    if (!set) {
      throw new BadRequestException('Set not found');
    }
    return set;
  }

  async update(id: string, updateSetDto: UpdateSetDto) {
    await this.findOne(id);
    return this.setsRepository.update(id, updateSetDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.setsRepository.remove(id);
  }
}
