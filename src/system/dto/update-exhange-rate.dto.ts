import { IsNumber } from 'class-validator';

export class UpdateSystemDto {
  @IsNumber()
  exchangeRate: number;
}
