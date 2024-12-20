import { IsUUID } from 'class-validator';

export class RemoveChatDto {
  @IsUUID()
  id: string;
}
