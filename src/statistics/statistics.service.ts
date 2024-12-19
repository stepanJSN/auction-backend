import { Injectable } from '@nestjs/common';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CardsService } from 'src/cards/cards.service';
import { CardInstanceStatisticType } from './types/card-instance-statistic.type';
import { SetsService } from 'src/sets/sets.service';
import { SetWithCardsType } from './types/set-with-cards.type';

@Injectable()
export class StatisticsService {
  constructor(
    private cardsService: CardsService,
    private cardInstancesService: CardInstancesService,
    private setsService: SetsService,
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

  async getNumberOfUsersPerSet(page = 1, take = 20) {
    const sets = await this.setsService.findAll({
      page,
      take,
    });

    const data = await Promise.all(
      sets.data.map(async (set: SetWithCardsType) => {
        let usersWithSet = 0;
        await this.cardInstancesService.findAllUsersWithCardsId({
          cardsId: set.cards.map((card) => card.id),
          forEachUserWithSet: () => {
            usersWithSet++;
          },
        });
        return {
          id: set.id,
          setName: set.name,
          numberOfUsers: usersWithSet,
        };
      }),
    );

    return {
      data,
      info: {
        page,
        totalCount: sets.info.totalCount,
        totalPages: sets.info.totalPages,
      },
    };
  }
}
