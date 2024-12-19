import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  WsException,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';
import { UpdateMessageDto } from './dto/update-message.dto';
import { FindAllMessagesOfChatDto } from './dto/find-all-messages-of-chat.dto';

@UseGuards(AuthGuard)
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }),
)
@WebSocketGateway()
export class MessagesGateway {
  @WebSocketServer()
  private server: Server;
  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('newMessage')
  async newMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    const message = await this.messagesService.create({
      ...createMessageDto,
      senderId: userId,
    });
    this.server.to(message.chat_id).emit('newMessage', message);
  }

  @SubscribeMessage('getAllMessages')
  async findAllMessages(
    @MessageBody() findAllMessages: FindAllMessagesOfChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.emit(
      'messages',
      await this.messagesService.findAll(findAllMessages),
    );
  }

  @SubscribeMessage('editMessage')
  async editMessage(@MessageBody() updatedMessageDto: UpdateMessageDto) {
    const updatedMessage = await this.messagesService.update(updatedMessageDto);
    this.server
      .to(updatedMessage.chat_id)
      .emit('updatedMessage', updatedMessage);
  }

  @SubscribeMessage('deleteMessage')
  async remove(@MessageBody('id') id: string) {
    const deletedMessage = await this.messagesService.remove(id);
    this.server
      .to(deletedMessage.chat_id)
      .emit('deletedMessage', deletedMessage);
  }
}
