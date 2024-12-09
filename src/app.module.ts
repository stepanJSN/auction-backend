import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { EpisodesModule } from './episodes/episodes.module';
import { EpisodesCardsModule } from './episodes-cards/episodes-cards.module';
import { CardsModule } from './cards/cards.module';
import { UsersCardsModule } from './users-cards/users-cards.module';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule, LocationsModule, EpisodesModule, EpisodesCardsModule, CardsModule, UsersCardsModule],
})
export class AppModule {}
