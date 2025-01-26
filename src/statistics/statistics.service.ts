import { Injectable } from '@nestjs/common';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CardsService } from 'src/cards/cards.service';
import { SetsService } from 'src/sets/sets.service';
import { SetWithCardsType } from './types/set-with-cards.type';
import { AuctionsService } from 'src/auctions/auctions.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class StatisticsService {
  constructor(
    private cardsService: CardsService,
    private cardInstancesService: CardInstancesService,
    private setsService: SetsService,
    private auctionsService: AuctionsService,
    private usersService: UsersService,
  ) {}

  async getCardsStatistics(page = 1, take = 20) {
    const cards = await this.cardsService.findAllWithDetails({
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

  async getTopUsersByCollectedCards(numberOfUsers: number) {
    const usersId = await this.cardInstancesService.groupCardByParam({
      param: 'user_id',
      sortOrder: 'desc',
      take: numberOfUsers,
    });

    return Promise.all(
      usersId.map(async (userId) => {
        const { id, name, surname } = await this.usersService.findOneById(
          userId.user_id,
        );
        return {
          id,
          name,
          surname,
          numberOfCards: userId._count.user_id,
        };
      }),
    );
  }

  async getGeneral() {
    const mostRepeatedCardId = await this.cardInstancesService.groupCardByParam(
      {
        param: 'card_id',
        sortOrder: 'desc',
        take: 1,
      },
    );
    const mostRepeatedCard = await this.cardsService.findOne(
      mostRepeatedCardId[0].card_id,
    );

    const leastRepeatedCardId =
      await this.cardInstancesService.groupCardByParam({
        param: 'card_id',
        sortOrder: 'asc',
        take: 1,
      });
    const leastRepeatedCard = await this.cardsService.findOne(
      leastRepeatedCardId[0].card_id,
    );

    const numberOfCardsCreatedByAdmin =
      await this.cardsService.countNumberOfCardsCreatedByAdmin();
    return {
      mostRepeatedCard: {
        id: mostRepeatedCard.id,
        name: mostRepeatedCard.name,
        numberOfInstances: mostRepeatedCardId[0]._count.card_id,
      },
      leastRepeatedCard: {
        id: leastRepeatedCard.id,
        name: leastRepeatedCard.name,
        numberOfInstances: leastRepeatedCardId[0]._count.card_id,
      },
      numberOfCardsCreatedByAdmin,
    };
  }
}
