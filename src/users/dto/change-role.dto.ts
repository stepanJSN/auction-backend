import { Role } from '@prisma/client';
import { IsIn, IsUUID } from 'class-validator';

export class ChangeRoleDto {
  @IsUUID()
  userId: string;
  @IsIn(['User', 'Admin'])
  role: Role;
}
