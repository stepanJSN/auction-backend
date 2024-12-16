import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSetDto } from './dto/create-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { SetsRepository } from './sets.repository';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { FindAllSetsServiceType } from './types/find-all-sets-service.type';
import { OnEvent } from '@nestjs/event-emitter';
import { AuctionsFinishedEvent } from 'src/auctions/events/auction-finished.event';
import { UsersService } from 'src/users/users.service';
import { Role } from '@prisma/client';

const SETS_PER_ITERATION = 30;

@Injectable()
export class SetsService {
  constructor(
    private setsRepository: SetsRepository,
    private cardInstancesService: CardInstancesService,
    private usersService: UsersService,
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

  findAllWithCard(cardId: string, page: number, take: number) {
    return this.setsRepository.findAllWithCard(cardId, page, take);
  }

  async findOne(id: string) {
    const set = await this.setsRepository.findOne(id);
    if (!set) {
      throw new NotFoundException('Set not found');
    }
    return set;
  }

  @OnEvent('auction.finished')
  async checkUserCollectedSets({
    cardInstanceId,
    winnerId: userId,
  }: AuctionsFinishedEvent) {
    if (!userId) return;
    const { card_id } = await this.cardInstancesService.findOne(cardInstanceId);

    let currentPage = 1;
    while (true) {
      const { sets, totalCount } = await this.findAllWithCard(
        card_id,
        currentPage,
        SETS_PER_ITERATION,
      );
      await Promise.all(
        sets.map(async (set) => {
          const cardInstances = await this.cardInstancesService.findAll({
            cardsId: set.cards
              .filter((card) => card.id !== card_id)
              .map((card) => card.id),
            userId,
          });
          if (cardInstances.length === set.cards.length - 1) {
            await this.usersService.updateRating(userId, set.bonus);
          }
        }),
      );

      const totalPages = Math.ceil(totalCount / SETS_PER_ITERATION);
      if (currentPage >= totalPages) break;
      currentPage++;
    }
  }

  update(id: string, updateSetDto: UpdateSetDto) {
    return this.setsRepository.update(id, updateSetDto);
  }

  remove(id: string) {
    return this.setsRepository.remove(id);
  }
}
