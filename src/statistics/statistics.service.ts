import { Injectable } from '@nestjs/common';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CardsService } from 'src/cards/cards.service';
import { SetsService } from 'src/sets/sets.service';
import { SetWithCardsType } from './types/set-with-cards.type';
import { AuctionsService } from 'src/auctions/auctions.service';

@Injectable()
export class StatisticsService {
  constructor(
    private cardsService: CardsService,
    private cardInstancesService: CardInstancesService,
    private setsService: SetsService,
    private auctionsService: AuctionsService,
  ) {}

  async getCardsStatistics(page = 1, take = 20) {
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
        averagePrice: await this.getCardAveragePrice(card.id),
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

  private async getCardAveragePrice(cardId: string) {
    const cardHighestBids: number[] = [];
    let currentPage = 1;
    while (true) {
      const { data, info } = await this.auctionsService.findAll({
        cardId,
        page: currentPage,
        take: 30,
      });

      data.forEach((auction) => {
        cardHighestBids.push(auction.highest_bid);
      });

      if (currentPage >= info.totalPages) break;
      currentPage++;
    }

    return cardHighestBids.reduce((a, b) => a + b, 0) / cardHighestBids.length;
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

  async getGeneral() {
    const mostAndLeastRepeatedCards =
      await this.cardInstancesService.getTheMostAndTheLeastRepeatedCards();

    const mostRepeatedCard = await this.cardsService.findOne(
      mostAndLeastRepeatedCards.mostRepeatedCard[0].card_id,
    );
    const leastRepeatedCard = await this.cardsService.findOne(
      mostAndLeastRepeatedCards.leastRepeatedCard[0].card_id,
    );

    const numberOfCardsCreatedByAdmin =
      await this.cardsService.countNumberOfCardsCreatedByAdmin();
    return {
      mostRepeatedCard: {
        id: mostRepeatedCard.id,
        name: mostRepeatedCard.name,
        numberOfInstances:
          mostAndLeastRepeatedCards.mostRepeatedCard[0]._count.card_id,
      },
      leastRepeatedCard: {
        id: leastRepeatedCard.id,
        name: leastRepeatedCard.name,
        numberOfInstances:
          mostAndLeastRepeatedCards.leastRepeatedCard[0]._count.card_id,
      },
      numberOfCardsCreatedByAdmin,
    };
  }
}
