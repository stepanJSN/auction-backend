import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindAllCards } from './dto/find-all-cards.dto';
import { CurrentUser } from 'src/decorators/user.decorator';
import { JWTPayload } from 'src/auth/types/auth.type';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RoleGuard } from 'src/guards/role.guard';

@Controller('cards')
@UseGuards(RoleGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000000 }),
          new FileTypeValidator({
            fileType: /(image\/(jpeg|png|avif|webp|jpg))/,
          }),
        ],
      }),
    )
    image: Express.Multer.File,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.cardsService.create(createCardDto, image);
  }

  @Get()
  findAll(
    @CurrentUser() user: JWTPayload,
    @Query() { page, take, name }: FindAllCards,
  ) {
    return this.cardsService.findAll({
      userId: user.id,
      role: user.role,
      page,
      take,
      name,
    });
  }

  @Get('myCards')
  findMyCards(
    @CurrentUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.cardsService.findAllByUserId(userId, paginationDto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cardsService.findOne(id, true, userId);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCardDto: UpdateCardDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000000 }),
          new FileTypeValidator({
            fileType: /(image\/(jpeg|png|avif|webp|jpg))/,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ) {
    return this.cardsService.update(id, updateCardDto, image);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.remove(id);
  }
}
