import { Module } from '@nestjs/common';
import { SetsService } from './sets.service';
import { SetsController } from './sets.controller';
import { SetsRepository } from './sets.repository';
import { CardInstancesModule } from 'src/card-instances/card-instances.module';
import { UsersModule } from 'src/users/users.module';
import { CardsModule } from 'src/cards/cards.module';

@Module({
  imports: [CardInstancesModule, UsersModule, CardsModule],
  controllers: [SetsController],
  providers: [SetsService, SetsRepository],
  exports: [SetsService],
})
export class SetsModule {}
