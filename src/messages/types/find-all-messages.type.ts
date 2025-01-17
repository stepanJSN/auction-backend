import { FindAllMessagesOfChatDto } from '../dto/find-all-messages-of-chat.dto';

export type FindAllMessagesType = FindAllMessagesOfChatDto & {
  userId: string;
};
