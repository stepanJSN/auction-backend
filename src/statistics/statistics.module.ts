import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { CardsModule } from 'src/cards/cards.module';
import { CardInstancesModule } from 'src/card-instances/card-instances.module';
import { SetsModule } from 'src/sets/sets.module';
import { AuctionsModule } from 'src/auctions/auctions.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    CardsModule,
    CardInstancesModule,
    SetsModule,
    AuctionsModule,
    UsersModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
