import { Role } from '@prisma/client';
import { IsIn } from 'class-validator';

export class ChangeRoleDto {
  @IsIn(['User', 'Admin'])
  role: Role;
}
