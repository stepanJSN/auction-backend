import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSetDto } from './create-set.dto';

export class UpdateSetDto extends PartialType(
  OmitType(CreateSetDto, ['cardsId']),
) {}
