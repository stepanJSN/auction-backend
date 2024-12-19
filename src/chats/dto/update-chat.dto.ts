import { PartialType } from '@nestjs/mapped-types';
import { CreateChatDto } from './create-chat.dto';
import { IsUUID } from 'class-validator';

export class UpdateChatDto extends PartialType(CreateChatDto) {
  @IsUUID()
  id: string;
}
