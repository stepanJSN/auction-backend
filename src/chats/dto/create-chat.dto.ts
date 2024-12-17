import { IsString, IsUUID, Length } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  receiverId: string;

  @IsString()
  @Length(1, 1000)
  message: string;
}
