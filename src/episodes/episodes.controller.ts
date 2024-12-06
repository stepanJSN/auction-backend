import { Controller, Get, Query } from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { FindAllEpisodesDto } from './dto/find-all-episodes.dto';

@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get()
  findAll(@Query() findAllLocations: FindAllEpisodesDto) {
    return this.episodesService.findAll(findAllLocations);
  }
}
