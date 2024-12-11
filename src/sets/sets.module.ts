import { Module } from '@nestjs/common';
import { SetsService } from './sets.service';
import { SetsController } from './sets.controller';
import { SetsRepository } from './sets.repository';
import { CardInstancesModule } from 'src/card-instances/card-instances.module';

@Module({
  imports: [CardInstancesModule],
  controllers: [SetsController],
  providers: [SetsService, SetsRepository],
})
export class SetsModule {}
