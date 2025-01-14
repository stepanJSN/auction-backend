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
import { MessagesService } from 'src/messages/messages.service';
import { FindAllMessagesDto } from './dto/find-all-messages.dto';
import { UpdateMessageDto } from 'src/messages/dto/update-message.dto';
import { CreateMessageDto } from 'src/messages/dto/create-message.dto';

@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
  ) {}

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

  @Post('/:id/messages')
  createMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.create({
      ...createMessageDto,
      chatId: id,
      senderId: userId,
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
      page: findAllChats.page ?? 1,
      take: findAllChats.take ?? 2,
    });
  }

  @Get('/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatsService.findOne(id);
  }

  @Get('/:id/messages')
  findAllMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() { take, cursor }: FindAllMessagesDto,
  ) {
    return this.messagesService.findAll({
      chatId: id,
      take: take ?? 10,
      cursor,
    });
  }

  @Patch('/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatsService.update(id, updateChatDto);
  }

  @Patch('/:id/messages/:messageId')
  updateMessage(
    @Param('messageId', ParseUUIDPipe) id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete('/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatsService.remove(id);
  }

  @Delete('/:id/messages/:messageId')
  removeMessage(@Param('messageId', ParseUUIDPipe) id: string) {
    return this.messagesService.remove(id);
  }
}
