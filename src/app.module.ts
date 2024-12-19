import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { EpisodesModule } from './episodes/episodes.module';
import { CardsModule } from './cards/cards.module';
import { CardInstancesModule } from './card-instances/card-instances.module';
import { ImagesModule } from './images/images.module';
import { ConfigModule } from '@nestjs/config';
import { AuctionsModule } from './auctions/auctions.module';
import { SetsModule } from './sets/sets.module';
import { BidsModule } from './bids/bids.module';
import configuration from 'config/configuration';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ImagesModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    LocationsModule,
    EpisodesModule,
    CardsModule,
    CardInstancesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    AuctionsModule,
    SetsModule,
    BidsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
