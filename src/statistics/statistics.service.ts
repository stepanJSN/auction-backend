import { Injectable } from '@nestjs/common';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CardsService } from 'src/cards/cards.service';
import { CardInstanceStatisticType } from './types/card-instance-statistic.type';

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
        id: card.id,
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

  async getTheMostAndTheLeastWidespreadCard() {
    let theMostWidespreadCard: CardInstanceStatisticType;
    let theLeastWidespreadCard: CardInstanceStatisticType;
    let currentPage = 1;

    while (true) {
      const { data: numberOfInstances, info } =
        await this.getNumberOfCardInstances(currentPage, 1);

      numberOfInstances.forEach((card) => {
        if (
          !theMostWidespreadCard ||
          card.numberOfInstances > theMostWidespreadCard.numberOfInstances
        ) {
          theMostWidespreadCard = card;
        }

        if (
          !theLeastWidespreadCard ||
          card.numberOfInstances < theLeastWidespreadCard.numberOfInstances
        ) {
          theLeastWidespreadCard = card;
        }
      });

      if (currentPage >= info.totalPages) break;
      currentPage++;
    }

    return {
      theMostWidespreadCard,
      theLeastWidespreadCard,
    };
  }
}
