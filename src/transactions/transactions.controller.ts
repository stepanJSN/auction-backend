import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CurrentUser } from 'src/decorators/user.decorator';
import { Role } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { RoleGuard } from 'src/guards/role.guard';
import { JWTPayload } from 'src/auth/types/auth.type';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('/topUp')
  topUp(
    @Body() { amount }: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.topUp(amount, userId);
  }

  @Post('/withdraw')
  withdraw(
    @Body() { amount }: CreateTransactionDto,
    @CurrentUser() userData: JWTPayload,
  ) {
    return this.transactionsService.withdraw(amount, userData);
  }

  @Get('/fee')
  @UseGuards(RoleGuard)
  @Roles(Role.Admin)
  calculateTotalFeeAmount() {
    return this.transactionsService.calculateTotalFeeAmount();
  }
}
