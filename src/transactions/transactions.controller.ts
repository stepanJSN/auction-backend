import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('/toUp')
  toUp(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.toUp(createTransactionDto);
  }

  @Post('/withdraw')
  withdraw(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.withdraw(createTransactionDto);
  }

  @Get('/calculateBalance/:userId')
  calculateBalance(@Param('userId') userId: string) {
    return this.transactionsService.calculateBalance(userId);
  }
}
