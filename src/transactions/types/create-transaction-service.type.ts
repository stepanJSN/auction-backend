import { CreateTransactionDto } from '../dto/create-transaction.dto';

export type CreateTransactionServiceType = CreateTransactionDto & {
  userId: string;
};
