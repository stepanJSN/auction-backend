import { IsOptional, IsString, Max, Min } from 'class-validator';

export class FindAllChatsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Min(1)
  @Max(50)
  take?: number;

  @IsOptional()
  @Min(1)
  page?: number;
}
