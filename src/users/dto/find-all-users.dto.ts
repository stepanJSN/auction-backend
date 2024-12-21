import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/dto/pagination.dto';

export class FindAllUsersDto extends PaginationDto {
  @IsOptional()
  @IsIn(['creationDate', 'rating'])
  sortType?: 'creationDate' | 'rating';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAdmin: boolean;
}
