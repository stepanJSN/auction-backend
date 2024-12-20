import { IsUUID, IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  chatId: string;

  @IsString()
  @Length(1, 1000)
  message: string;
}
