import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FindAllAuctionsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  locationId?: number;

  @IsOptional()
  @IsString()
  cardName?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  fromPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  toPrice?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isUserTakePart: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isUserLeader: boolean;

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
