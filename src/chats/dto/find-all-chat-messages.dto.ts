import { IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FindAllChatMessagesDto {
  @IsUUID()
  peerId: string;

  @IsOptional()
  @Min(1)
  @Max(100)
  page: number;

  @IsOptional()
  @Min(1)
  take: number;
}
