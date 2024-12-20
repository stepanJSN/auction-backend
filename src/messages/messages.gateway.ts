import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { Server } from 'socket.io';
import { MessagesWsOutgoingEventsEnum } from './enums/messages-ws-events.enum';
import { MessageType } from './types/message.type';

@UseGuards(AuthGuard)
@WebSocketGateway()
export class MessagesGateway {
  @WebSocketServer()
  private server: Server;

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
