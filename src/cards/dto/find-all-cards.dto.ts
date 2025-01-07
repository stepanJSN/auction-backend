import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/dto/pagination.dto';

export class FindAllCards extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;
}
