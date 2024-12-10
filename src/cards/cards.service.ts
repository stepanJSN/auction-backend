import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import type { cards as CardType, Role } from '@prisma/client';
import { CardsRepository } from './cards.repository';

const CARD_PER_ITERATION = 20;

@Injectable()
export class CardsService {
  constructor(
    private cardsRepository: CardsRepository,
    private cardInstancesService: CardInstancesService,
  ) {}

  async areCardsSold(cards: CardType[]) {
    const cardInstances = await this.cardInstancesService.findAll({
      cardsId: cards.map((card) => card.id),
    });
    return cardInstances.length > 0;
  }

  async create(createCardDto: CreateCardDto) {
    let currentPage = 1;
    while (true) {
      const cardsChunk = await this.cardsRepository.findAll({
        isCreatedByAdmin: false,
        page: currentPage,
        take: CARD_PER_ITERATION,
      });
      if (!this.areCardsSold(cardsChunk.cards)) {
        throw new BadRequestException('Not all cards from the API were sold');
      }
      const totalPages = Math.ceil(cardsChunk.totalCount / CARD_PER_ITERATION);
      if (totalPages === currentPage) break;
      currentPage++;
    }
    return this.cardsRepository.create(createCardDto);
  }

  async findAll(userId: string, role: Role, page: number, take: number) {
    const { cards, totalCount } = await this.cardsRepository.findAll({
      active: true,
      page,
      take,
    });
    const cardsId = cards.map((card) => card.id);
    const info = {
      page,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
    };
    if (role === 'User') {
      const cardInstances = await this.cardInstancesService.findAll({
        userId,
        cardsId,
      });
      const cardsWithOwnershipFlag = cards.map((card) => ({
        ...card,
        isOwned: cardInstances.some(
          (cardInstance) => cardInstance.card_id === card.id,
        ),
      }));
      return {
        data: cardsWithOwnershipFlag,
        info: info,
      };
    }
    return {
      data: cards,
      info: info,
    };
  }

  async findOne(id: string, includeEpisodes = false) {
    const card = await this.cardsRepository.findOneById(id, includeEpisodes);
    if (!card) {
      throw new BadRequestException('Card not found');
    }
    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto) {
    await this.findOne(id);
    return this.cardsRepository.update(id, updateCardDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    this.cardsRepository.delete(id);
  }
}
