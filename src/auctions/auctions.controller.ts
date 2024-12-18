import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CurrentUser } from 'src/decorators/user.decorator';
import { JWTPayload } from 'src/auth/types/auth.type';
import { FindAllAuctionsDto } from './dto/find-all-auction.dto';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  create(
    @CurrentUser() user: JWTPayload,
    @Body() createAuctionDto: CreateAuctionDto,
  ) {
    return this.auctionsService.create({
      ...createAuctionDto,
      createdBy: user.id,
      role: user.role,
    });
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() findAllAuctionsDto: FindAllAuctionsDto,
  ) {
    return this.auctionsService.findAll({
      ...findAllAuctionsDto,
      participantId: userId,
      take: findAllAuctionsDto.take ?? 20,
      page: findAllAuctionsDto.page ?? 1,
      // isCompleted: false,
    });
  }

  @Get('/myAuctions')
  findAllByUser(
    @CurrentUser('id') userId: string,
    @Query() findAllAuctionsDto: FindAllAuctionsDto,
  ) {
    return this.auctionsService.findAll({
      ...findAllAuctionsDto,
      createdById: userId,
      take: findAllAuctionsDto.take ?? 20,
      page: findAllAuctionsDto.page ?? 1,
    });
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.auctionsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
  ) {
    return this.auctionsService.update(id, updateAuctionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.auctionsService.remove(id);
  }
}
