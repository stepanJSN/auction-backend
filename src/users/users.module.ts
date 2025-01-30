import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [forwardRef(() => TransactionsModule)],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
