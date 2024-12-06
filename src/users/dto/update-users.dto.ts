import { Role } from '@prisma/client';
import { CreateUsersDto } from './create-users.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';

export class UpdateUsersDto extends PartialType(
  OmitType(CreateUsersDto, ['email'] as const),
) {
  role?: Role;
}
