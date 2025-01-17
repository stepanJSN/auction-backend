import { IsOptional, Min, Max, IsUUID } from 'class-validator';

export class FindAllMessagesDto {
  @IsOptional()
  @Min(1)
  @Max(50)
  take?: number;

  @IsOptional()
  @IsUUID()
  cursor?: string;
}
