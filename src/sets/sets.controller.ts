import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SetsService } from './sets.service';
import { CreateSetDto } from './dto/create-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { FindAllSets } from './dto/find-all-sets.dto';
import { CurrentUser } from 'src/decorators/user.decorator';
import { JWTPayload } from 'src/auth/types/auth.type';

@Controller('sets')
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @Post()
  create(@Body() createSetDto: CreateSetDto) {
    return this.setsService.create(createSetDto);
  }

  @Get()
  findAll(
    @CurrentUser() { role, id }: JWTPayload,
    @Query() { page, take }: FindAllSets,
  ) {
    return this.setsService.findAll({ role, userId: id, page, take });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.setsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSetDto: UpdateSetDto,
  ) {
    return this.setsService.update(id, updateSetDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.setsService.remove(id);
  }
}
