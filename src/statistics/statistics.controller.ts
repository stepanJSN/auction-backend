import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PaginationDto } from 'src/dto/pagination.dto';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('/cardsStatistics')
  getCardsSt(@Query() { page, take }: PaginationDto) {
    return this.statisticsService.getCardsStatistics(page, take);
  }

  @Get('/usersStatistics')
  getTopUsersByCollectedCards(
    @Query('numberOfUsers', new ParseIntPipe({ optional: true }))
    numberOfUsers = 10,
  ) {
    return this.statisticsService.getTopUsersByCollectedCards(numberOfUsers);
  }

  @Get('/setsStatistics')
  getNumberOfUsersPerSet(@Query() { page, take }: PaginationDto) {
    return this.statisticsService.getNumberOfUsersPerSet(page, take);
  }

  @Get('/generalStatistics')
  getGeneral() {
    return this.statisticsService.getGeneral();
  }
}
