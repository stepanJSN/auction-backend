import { Module } from '@nestjs/common';
import { SetsService } from './sets.service';
import { SetsController } from './sets.controller';
import { SetsRepository } from './sets.repository';

@Module({
  controllers: [SetsController],
  providers: [SetsService, SetsRepository],
})
export class SetsModule {}
