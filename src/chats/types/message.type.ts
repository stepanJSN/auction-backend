export type MessageType = {
  id: string;
  created_at: Date;
  message: string;
  sender: {
    id: string;
    name: string;
    surname: string;
  };
};
