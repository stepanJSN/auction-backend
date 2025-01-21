import { users } from '@prisma/client';

export type UpdateUserType = Partial<
  Omit<users, 'id' | 'created_at' | 'email'>
>;
