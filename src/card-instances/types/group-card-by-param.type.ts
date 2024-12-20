import { card_instances } from '@prisma/client';

export type GroupCardByParamType = {
  param: keyof card_instances;
  sortOrder: 'asc' | 'desc';
  take: number;
};
