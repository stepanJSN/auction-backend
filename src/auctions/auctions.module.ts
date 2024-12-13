import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { AuctionsRepository } from './auctions.repository';
import { AuctionsGateway } from './auctions.gateway';
import { CardInstancesModule } from 'src/card-instances/card-instances.module';
import { AuctionsCronService } from './auctions-cron.service';

@Module({
  imports: [ScheduleModule.forRoot(), CardInstancesModule],
  controllers: [AuctionsController],
  providers: [
    AuctionsService,
    AuctionsRepository,
    AuctionsGateway,
    AuctionsCronService,
  ],
  exports: [AuctionsService],
})
export class AuctionsModule {}
