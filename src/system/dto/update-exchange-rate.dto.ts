import { IsNumber } from 'class-validator';

export class UpdateExchangeRateDto {
  @IsNumber()
  exchangeRate: number;
}
