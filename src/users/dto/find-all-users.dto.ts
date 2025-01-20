import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/dto/pagination.dto';

export class FindAllUsersDto extends PaginationDto {
  @IsOptional()
  @IsIn(['creationDate', 'rating'])
  sortType?: 'creationDate' | 'rating';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsString()
  fullName?: string;
}
