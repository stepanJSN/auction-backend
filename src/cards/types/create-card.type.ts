import { CreateCardDto } from '../dto/create-card.dto';

export type CreateCardType = CreateCardDto & {
  imageUrl: string;
};
