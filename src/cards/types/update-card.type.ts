import { UpdateCardDto } from '../dto/update-card.dto';

export type UpdateCardType = UpdateCardDto & {
  imageUrl?: string;
};
