import { Module } from '@nestjs/common';
import { UsersCardsService } from './users-cards.service';
import { UsersCardsRepository } from './users-cards.repository';

@Module({
  providers: [UsersCardsService, UsersCardsRepository],
  exports: [UsersCardsService],
})
export class UsersCardsModule {}
