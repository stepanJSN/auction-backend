import { PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';
import { IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @Type(() => Boolean)
  @IsBoolean()
  isActive: boolean;
}
