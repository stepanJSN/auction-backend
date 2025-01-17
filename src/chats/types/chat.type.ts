import { MessageType } from './message.type';

export type ChatType = {
  id: string;
  name: string;
  users: {
    id: string;
    name: string;
    surname: string;
  }[];
  messages: MessageType[];
};
