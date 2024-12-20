import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CardInstancesService } from 'src/card-instances/card-instances.service';
import { CardsRepository } from './cards.repository';
import { ImagesService } from 'src/images/images.service';
import { FindAllCardsServiceType } from './types/find-all-cards-service.type';
import { Role } from '@prisma/client';

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
      const cards = await this.cardsRepository.findAll({
        isCreatedByAdmin: false,
        page: currentPage,
        take: CARD_PER_ITERATION,
      });

      const totalCount = await this.cardsRepository.countNumberOfCards({
        isCreatedByAdmin: false,
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

  async findAll({ userId, role, page, take }: FindAllCardsServiceType) {
    const cards = await this.cardsRepository.findAll({
      active: role === Role.User,
      page,
      take,
    });
    const totalCount = await this.cardsRepository.countNumberOfCards({
      active: role === Role.User,
    });
    const info = {
      page,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
    };
    if (role !== Role.User) {
      return { data: cards, info };
    }

    const cardsWithOwnershipFlag =
      await this.cardInstancesService.attachOwnershipFlag(cards, userId);

    return {
      data: cardsWithOwnershipFlag,
      info,
    };
  }

  countNumberOfCardsCreatedByAdmin() {
    return this.cardsRepository.countNumberOfCards({
      isCreatedByAdmin: true,
    });
  }

  async findOne(id: string, includeEpisodes = false) {
    const card = await this.cardsRepository.findOneById(id, includeEpisodes);
    if (!card) {
      throw new NotFoundException('Card not found');
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
    const { image_url } = await this.cardsRepository.findOneById(id);
    if (image_url) {
      await this.imagesService.delete(image_url);
    }
    this.cardsRepository.delete(id);
  }
}
