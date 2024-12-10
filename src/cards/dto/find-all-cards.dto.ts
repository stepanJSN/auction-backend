import { Transform } from 'class-transformer';
import { IsNumberString, IsOptional, Max, Min } from 'class-validator';

export class FindAllCards {
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @Min(1)
  @Max(50)
  take?: number;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @Min(1)
  page?: number;
}
