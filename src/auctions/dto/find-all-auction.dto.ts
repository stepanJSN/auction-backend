import { Transform } from 'class-transformer';
import {
  IsDecimal,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FindAllAuctionsDto {
  @IsOptional()
  @IsInt()
  locationId: number;

  @IsOptional()
  @IsString()
  cardName: string;

  @IsOptional()
  @IsDecimal()
  fromPrice: number;

  @IsOptional()
  @IsDecimal()
  toPrice: number;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc';

  @IsOptional()
  @IsIn(['creationDate', 'finishDate', 'highestBid'])
  sortBy: 'creationDate' | 'finishDate' | 'highestBid';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @Min(1)
  @Max(50)
  take?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @Min(1)
  page?: number;
}
