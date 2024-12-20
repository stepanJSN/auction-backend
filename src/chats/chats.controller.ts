import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CurrentUser } from 'src/decorators/user.decorator';
import { FindAllChatsDto } from './dto/find-all-chats.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  create(
    @Body() createChatDto: CreateChatDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatsService.create({
      name: createChatDto.name,
      participants: createChatDto.participants,
      userId,
    });
  }

  @Get()
  findAll(
    @Query() findAllChats: FindAllChatsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatsService.findAll({
      userId,
      name: findAllChats.name,
      page: findAllChats.page,
      take: findAllChats.take,
    });
  }

  @Patch('/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatsService.update(id, updateChatDto);
  }

  @Delete('/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatsService.remove(id);
  }
}
