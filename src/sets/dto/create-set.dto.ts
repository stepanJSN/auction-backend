import { IsArray, IsInt, IsString, Length } from 'class-validator';

export class CreateSetDto {
  @IsString()
  @Length(2, 30)
  name: string;

  @IsInt()
  bonus: number;

  @IsArray()
  cardsId: string[];
}
