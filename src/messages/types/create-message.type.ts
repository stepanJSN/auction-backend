import { CreateMessageDto } from '../dto/create-message.dto';

export type CreateMessageType = CreateMessageDto & {
  chatId: string;
  senderId: string;
};
