import { CreateMessageDto } from '../dto/create-message.dto';

export type CreateMessageType = CreateMessageDto & {
  senderId: string;
};
