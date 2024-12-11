import { Transform } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';

export class FindAllUsers {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  @Max(50)
  take?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  page?: number;
}
