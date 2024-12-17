import { IsNumber, IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  amount: number;
}
