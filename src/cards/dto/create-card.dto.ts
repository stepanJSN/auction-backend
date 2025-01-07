import { Gender } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateCardDto {
  @IsString()
  @Length(2, 30)
  name: string;

  @IsString()
  @IsOptional()
  @Length(2, 30)
  type: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  locationId: number;

  @IsIn(['unknown', 'female', 'male', 'unknown'])
  gender: Gender;

  @Type(() => Boolean)
  @IsBoolean()
  isActive: boolean;

  @Transform(({ value }) => JSON.parse(value))
  @IsArray()
  episodesId: number[];
}
