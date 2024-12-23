import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/dto/pagination.dto';

export class FindAllAuctionsDto extends PaginationDto {
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
  isUserTakePart?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isUserLeader?: boolean;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsIn(['creationDate', 'finishDate', 'highestBid'])
  sortBy?: 'creationDate' | 'finishDate' | 'highestBid';
}
