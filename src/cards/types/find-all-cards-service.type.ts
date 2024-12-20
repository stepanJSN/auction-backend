import { Role } from '@prisma/client';

export type FindAllCardsServiceType = {
  userId?: string;
  role?: Role;
  page: number;
  take: number;
};
