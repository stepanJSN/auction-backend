import { Gender } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsString, Length } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @Length(2, 20)
  name: string;

  @IsString()
  @Length(2, 20)
  type: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  locationId: number;

  @IsIn(['unknown', 'female', 'male', 'unknown'])
  gender: Gender;

  @Transform(({ value }) => JSON.parse(value))
  @IsArray()
  episodesId: number[];
}
