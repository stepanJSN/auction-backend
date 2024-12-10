import { Role } from '@prisma/client';

export type UpdateUserType = {
  email?: string;
  name?: string;
  surname?: string;
  password?: string;
  role?: Role;
  rating?: number;
};
