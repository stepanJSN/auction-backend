import { IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FindAllMessagesOfChatDto {
  @IsUUID()
  chatId: string;

  @IsOptional()
  @Min(1)
  @Max(50)
  take?: number;

  @IsOptional()
  @IsUUID()
  cursor?: string;
}
