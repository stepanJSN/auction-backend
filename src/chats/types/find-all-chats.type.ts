import { FindAllChatsDto } from '../dto/find-all-chats.dto';

export type FindAllChatsType = FindAllChatsDto & {
  userId: string;
};
