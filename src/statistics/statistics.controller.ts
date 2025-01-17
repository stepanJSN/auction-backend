import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Role } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { RoleGuard } from 'src/guards/role.guard';

@Controller('statistics')
@UseGuards(RoleGuard)
@Roles(Role.Admin)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('/cards')
  getCardsStatistics(@Query() { page, take }: PaginationDto) {
    return this.statisticsService.getCardsStatistics(page, take);
  }

  @Get('/users')
  getTopUsersByCollectedCards(
    @Query('numberOfUsers', new ParseIntPipe({ optional: true }))
    numberOfUsers = 10,
  ) {
    return this.statisticsService.getTopUsersByCollectedCards(numberOfUsers);
  }

  @Get('/sets')
  getNumberOfUsersPerSet(@Query() { page, take }: PaginationDto) {
    return this.statisticsService.getNumberOfUsersPerSet(page, take);
  }

  @Get('/general')
  getGeneralStatistics() {
    return this.statisticsService.getGeneral();
  }
}
