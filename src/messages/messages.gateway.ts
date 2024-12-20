import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { Server, Socket } from 'socket.io';
import { MessagesWsOutgoingEventsEnum } from './enums/messages-ws-events.enum';
import { MessageType } from './types/message.type';

@UseGuards(AuthGuard)
@WebSocketGateway()
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;
  constructor(private readonly authGuard: AuthGuard) {}

  async handleConnection(client: Socket) {
    const context = { switchToWs: () => ({ getClient: () => client }) } as any;
    try {
      await this.authGuard.validateWsRequest(context);
    } catch {
      client.disconnect();
      return;
    }
  }

  async newMessage(chatId: string, message: MessageType) {
    this.server.to(chatId).emit(MessagesWsOutgoingEventsEnum.NEW, message);
  }

  editMessage(chatId: string, message: MessageType) {
    this.server.to(chatId).emit(MessagesWsOutgoingEventsEnum.UPDATED, message);
  }

  remove(chatId: string, messageId: string) {
    this.server
      .to(chatId)
      .emit(MessagesWsOutgoingEventsEnum.DELETED, messageId);
  }
}
