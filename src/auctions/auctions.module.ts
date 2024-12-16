import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { AuctionsRepository } from './auctions.repository';
import { AuctionsGateway } from './auctions.gateway';
import { CardInstancesModule } from 'src/card-instances/card-instances.module';
import { AuctionsCronService } from './auctions-cron.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CardInstancesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt_key'),
      }),
    }),
  ],
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
