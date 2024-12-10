import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { FindAllEpisodesDto } from './dto/find-all-episodes.dto';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Controller('episodes')
@UseGuards(RoleGuard)
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Post()
  @Roles(Role.Admin)
  create(@Body() createLocationDto: CreateEpisodeDto) {
    return this.episodesService.create(createLocationDto);
  }

  @Get()
  findAll(@Query() findAllLocations: FindAllEpisodesDto) {
    return this.episodesService.findAll(findAllLocations);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.episodesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLocationDto: UpdateEpisodeDto,
  ) {
    return this.episodesService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.episodesService.remove(id);
  }
}
