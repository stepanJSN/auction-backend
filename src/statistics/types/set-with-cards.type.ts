import { cards } from '@prisma/client';

export type SetWithCardsType = {
  id: string;
  name: string;
  bonus: number;
  cards: cards[];
};
