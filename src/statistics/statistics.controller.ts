import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PaginationDto } from 'src/dto/pagination.dto';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('/numberOfCardInstances')
  getNumberOfCardInstances(@Query() { page, take }: PaginationDto) {
    return this.statisticsService.getNumberOfCardInstances(page, take);
  }

  @Get('/getTheNumberOfUsersPerSet')
  getNumberOfUsersPerSet(@Query() { page, take }: PaginationDto) {
    return this.statisticsService.getNumberOfUsersPerSet(page, take);
  }

  @Get('/cardsStatistics')
  getCardsStatistics() {
    return this.statisticsService.getTheMostAndTheLeastWidespreadCard();
  }
}
