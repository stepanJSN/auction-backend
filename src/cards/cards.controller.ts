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
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindAllCards } from './dto/find-all-cards.dto';
import { CurrentUser } from 'src/decorators/user.decorator';
import { JWTPayload } from 'src/auth/types/auth.type';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
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
    @Query() { page, take }: FindAllCards,
  ) {
    return this.cardsService.findAll({
      userId: user.id,
      role: user.role,
      page: page ?? 1,
      take: take ?? 20,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.findOne(id, true);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    return this.cardsService.update(id, updateCardDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.remove(id);
  }
}
