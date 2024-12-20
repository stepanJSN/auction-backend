import { CreateChatDto } from '../dto/create-chat.dto';

export type CreateChatType = CreateChatDto & {
  userId: string;
};
