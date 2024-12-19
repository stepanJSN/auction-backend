import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { CardsModule } from 'src/cards/cards.module';
import { CardInstancesModule } from 'src/card-instances/card-instances.module';

@Module({
  imports: [CardsModule, CardInstancesModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
