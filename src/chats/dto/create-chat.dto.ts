import { IsArray } from 'class-validator';

export class CreateChatDto {
  @IsArray()
  participants: string[];
}
