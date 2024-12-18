import { IsString, IsUUID, Length } from 'class-validator';

export class UpdateMessageDto {
  @IsUUID()
  messageId: string;

  @IsString()
  @Length(1, 1000)
  message: string;
}
