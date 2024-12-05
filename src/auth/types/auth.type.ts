import { Role } from '@prisma/client';

export type JWTPayload = {
  id: string;
  email: string;
  role: Role;
};
