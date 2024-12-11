import { Role } from '@prisma/client';
import { FindAllSets } from '../dto/find-all-sets.dto';

export type FindAllSetsServiceType = FindAllSets & {
  role: Role;
  userId: string;
};
