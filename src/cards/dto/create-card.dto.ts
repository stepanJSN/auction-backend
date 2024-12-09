import { Gender } from '@prisma/client';
import { IsArray, IsIn, IsInt, IsString, Length } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @Length(2, 20)
  name: string;

  @IsString()
  @Length(2, 20)
  type: string;

  @IsInt()
  locationId: number;

  @IsIn(['unknown', 'female', 'male', 'unknown'])
  gender: Gender;

  @IsArray()
  episodesId: number[];
}
