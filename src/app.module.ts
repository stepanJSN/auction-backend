import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { EpisodesModule } from './episodes/episodes.module';
import { ImagesModule } from './images/images.module';
import { ConfigModule } from '@nestjs/config';
import configuration from 'config/configuration';

@Module({
  imports: [
    ImagesModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    LocationsModule,
    EpisodesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
})
export class AppModule {}
