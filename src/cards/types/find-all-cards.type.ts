export type FindAllCardsType = {
  page: number;
  take: number;
  userId?: string;
  active?: boolean;
  isCreatedByAdmin?: boolean;
};
