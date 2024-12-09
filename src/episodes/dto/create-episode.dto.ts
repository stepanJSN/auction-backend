import { IsString } from 'class-validator';

export class CreateEpisodeDto {
  @IsString()
  name: string;

  @IsString()
  code: string;
}
