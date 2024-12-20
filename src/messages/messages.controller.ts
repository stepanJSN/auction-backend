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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser } from 'src/decorators/user.decorator';
import { FindAllMessagesOfChatDto } from './dto/find-all-messages-of-chat.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.create({
      ...createMessageDto,
      senderId: userId,
    });
  }

  @Get()
  findAllMessages(@Query() findAllMessages: FindAllMessagesOfChatDto) {
    return this.messagesService.findAll(findAllMessages);
  }

  @Patch('/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete('/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.messagesService.remove(id);
  }
}
