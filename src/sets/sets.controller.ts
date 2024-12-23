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
  UseGuards,
} from '@nestjs/common';
import { SetsService } from './sets.service';
import { CreateSetDto } from './dto/create-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { FindAllSets } from './dto/find-all-sets.dto';
import { CurrentUser } from 'src/decorators/user.decorator';
import { JWTPayload } from 'src/auth/types/auth.type';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('sets')
@UseGuards(RoleGuard)
export class SetsController {
  constructor(private readonly setsService: SetsService) {}

  @Post()
  @Roles(Role.Admin)
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
  @Roles(Role.Admin)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSetDto: UpdateSetDto,
  ) {
    return this.setsService.update(id, updateSetDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.setsService.remove(id);
  }
}
