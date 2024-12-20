import { IsUUID } from 'class-validator';

export class RemoveMessageDto {
  @IsUUID()
  id: string;
}
