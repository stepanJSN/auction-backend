import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  WsException,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';
import { UpdateMessageDto } from './dto/update-message.dto';
import { FindAllMessagesOfChatDto } from './dto/find-all-messages-of-chat.dto';
import {
  MessagesWsIncomingEventsEnum,
  MessagesWsOutgoingEventsEnum,
} from './enums/messages-ws-events.enum';

@UseGuards(AuthGuard)
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }),
)
@WebSocketGateway()
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;
  constructor(
    private readonly messagesService: MessagesService,
    private readonly authGuard: AuthGuard,
  ) {}

  async handleConnection(client: Socket) {
    const context = { switchToWs: () => ({ getClient: () => client }) } as any;
    try {
      await this.authGuard.validateWsRequest(context);
    } catch {
      client.disconnect();
      return;
    }
  }

  @SubscribeMessage(MessagesWsIncomingEventsEnum.CREATE)
  async newMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    const message = await this.messagesService.create({
      ...createMessageDto,
      senderId: userId,
    });
    this.server
      .to(message.chat_id)
      .emit(MessagesWsOutgoingEventsEnum.NEW, message);
  }

  @SubscribeMessage(MessagesWsIncomingEventsEnum.GET_ALL)
  async findAllMessages(
    @MessageBody() findAllMessages: FindAllMessagesOfChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.emit(
      MessagesWsOutgoingEventsEnum.ALL,
      await this.messagesService.findAll(findAllMessages),
    );
  }

  @SubscribeMessage(MessagesWsIncomingEventsEnum.UPDATE)
  async editMessage(@MessageBody() updatedMessageDto: UpdateMessageDto) {
    const updatedMessage = await this.messagesService.update(updatedMessageDto);
    this.server
      .to(updatedMessage.chat_id)
      .emit(MessagesWsOutgoingEventsEnum.UPDATED, updatedMessage);
  }

  @SubscribeMessage(MessagesWsIncomingEventsEnum.DELETE)
  async remove(@MessageBody('id') id: string) {
    const deletedMessage = await this.messagesService.remove(id);
    this.server
      .to(deletedMessage.chat_id)
      .emit(MessagesWsOutgoingEventsEnum.DELETED, deletedMessage);
  }
}
