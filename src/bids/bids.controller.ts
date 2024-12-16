import { Body, Controller, Post } from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { CurrentUser } from 'src/decorators/user.decorator';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createBidDto: CreateBidDto,
  ) {
    return this.bidsService.create({ userId, ...createBidDto });
  }
}
