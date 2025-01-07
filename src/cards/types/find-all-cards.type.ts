export type FindAllCardsType = {
  page: number;
  take: number;
  name?: string;
  userId?: string;
  active?: boolean;
  isCreatedByAdmin?: boolean;
};
