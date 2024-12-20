import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { CardInstancesModule } from 'src/card-instances/card-instances.module';
import { ImagesModule } from 'src/images/images.module';

@Module({
  imports: [CardInstancesModule, ImagesModule],
  controllers: [CardsController],
  providers: [CardsService, CardsRepository],
  exports: [CardsService],
})
export class CardsModule {}
