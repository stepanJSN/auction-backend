import { Controller, Post, Body } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CurrentUser } from 'src/decorators/user.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('/toUp')
  toUp(
    @Body() { amount }: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.toUp({ amount, userId });
  }

  @Post('/withdraw')
  withdraw(
    @Body() { amount }: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.withdraw({ amount, userId });
  }
}
