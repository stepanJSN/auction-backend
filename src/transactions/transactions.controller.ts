import { Controller, Post, Body } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CurrentUser } from 'src/decorators/user.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('/topUp')
  topUp(
    @Body() { amount }: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.topUp({ amount, userId });
  }

  @Post('/withdraw')
  withdraw(
    @Body() { amount }: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.withdraw({ amount, userId });
  }
}
