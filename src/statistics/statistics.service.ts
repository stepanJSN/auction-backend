import { Injectable } from '@nestjs/common';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CardsService } from 'src/cards/cards.service';

@Injectable()
export class StatisticsService {
  constructor(
    private cardsService: CardsService,
    private cardInstancesService: CardInstancesService,
  ) {}

  async getNumberOfCardInstances(page = 1, take = 20) {
    const cards = await this.cardsService.findAll({
      page,
      take,
    });

    const data = await Promise.all(
      cards.data.map(async (card) => ({
        cardName: card.name,
        numberOfInstances: await this.cardInstancesService.countAllByCardId(
          card.id,
        ),
      })),
    );

    return {
      data,
      info: {
        page,
        totalCount: cards.info.totalCount,
        totalPages: cards.info.totalPages,
      },
    };
  }
}
