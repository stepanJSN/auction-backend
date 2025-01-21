import { Controller, Get, Body, Patch } from '@nestjs/common';
import { SystemService } from './system.service';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('/exchange-rate')
  findOne() {
    return this.systemService.findExchangeRate();
  }

  @Patch('/exchange-rate')
  update(@Body() { exchangeRate }: UpdateExchangeRateDto) {
    return this.systemService.updateExchangeRate(exchangeRate);
  }
}
