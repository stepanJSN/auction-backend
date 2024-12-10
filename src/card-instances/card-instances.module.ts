import { Module } from '@nestjs/common';
import { CardInstancesService } from './card-instances.service';
import { CardInstancesRepository } from './card-instances.repository';

@Module({
  providers: [CardInstancesService, CardInstancesRepository],
  exports: [CardInstancesService],
})
export class CardInstancesModule {}
