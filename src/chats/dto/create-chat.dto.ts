import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  participants: string[];
}
