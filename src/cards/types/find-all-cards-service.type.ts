import { Role } from '@prisma/client';

export type FindAllCardsServiceType = {
  userId?: string;
  role?: Role;
  name?: string;
  page: number;
  take: number;
};
