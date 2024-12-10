import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import type { cards as CardType } from '@prisma/client';
import { CardsRepository } from './cards.repository';
import { ImagesService } from 'src/images/images.service';
import { FindAllCardsServiceType } from './types/find-all-cards-service.type';

const CARD_PER_ITERATION = 20;

@Injectable()
export class CardsService {
  constructor(
    private cardsRepository: CardsRepository,
    private cardInstancesService: CardInstancesService,
    private imagesService: ImagesService,
  ) {}

  private async areNotAllCardsSoldByAPI(): Promise<boolean> {
    let currentPage = 1;
    while (true) {
      const { cards, totalCount } = await this.cardsRepository.findAll({
        isCreatedByAdmin: false,
        page: currentPage,
        take: CARD_PER_ITERATION,
      });

      const cardInstances = await this.cardInstancesService.findAll({
        cardsId: cards.map((card) => card.id),
      });
      if (!(cardInstances.length > 0)) return true;

      const totalPages = Math.ceil(totalCount / CARD_PER_ITERATION);
      if (currentPage >= totalPages) break;
      currentPage++;
    }
    return false;
  }

  async create(createCardDto: CreateCardDto, image: Express.Multer.File) {
    const cardsAvailable = await this.areNotAllCardsSoldByAPI();
    if (cardsAvailable) {
      throw new BadRequestException('Not all cards from the API were sold');
    }

    const filename = Date.now() + image.originalname;
    const imageUrl = await this.imagesService.upload(filename, image);

    return this.cardsRepository.create({ ...createCardDto, imageUrl });
  }

  private async attachOwnershipFlag(cards: CardType[], userId: string) {
    const cardsId = cards.map((card) => card.id);
    const cardInstances = await this.cardInstancesService.findAll({
      userId,
      cardsId,
    });

    return cards.map((card) => ({
      ...card,
      isOwned: cardInstances.some(
        (cardInstance) => cardInstance.card_id === card.id,
      ),
    }));
  }

  async findAll({ userId, role, page, take }: FindAllCardsServiceType) {
    const { cards, totalCount } = await this.cardsRepository.findAll({
      active: role === 'User',
      page,
      take,
    });
    const info = {
      page,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
    };
    if (role !== 'User') {
      return { data: cards, info };
    }

    const cardsWithOwnershipFlag = await this.attachOwnershipFlag(
      cards,
      userId,
    );

    return {
      data: cardsWithOwnershipFlag,
      info,
    };
  }

  async findOne(id: string, includeEpisodes = false) {
    const card = await this.cardsRepository.findOneById(id, includeEpisodes);
    if (!card) {
      throw new BadRequestException('Card not found');
    }
    return card;
  }

  async update(
    id: string,
    updateCardDto: UpdateCardDto,
    image?: Express.Multer.File,
  ) {
    const { image_url } = await this.findOne(id);

    if (image) {
      await this.imagesService.delete(image_url);
      const filename = Date.now() + image.originalname;
      const imageUrl = await this.imagesService.upload(filename, image);
      return this.cardsRepository.update(id, { ...updateCardDto, imageUrl });
    }

    return this.cardsRepository.update(id, updateCardDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    this.cardsRepository.delete(id);
  }
}
