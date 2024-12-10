import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { EpisodesModule } from './episodes/episodes.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [
    ImagesModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    LocationsModule,
    EpisodesModule,
  ],
})
export class AppModule {}
