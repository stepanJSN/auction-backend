import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { Server, Socket } from 'socket.io';
import { ChatWsOutgoingEventsEnum } from './enums/chat-ws-events.enum';

@UseGuards(AuthGuard)
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  constructor(
    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
    private readonly authGuard: AuthGuard,
  ) {}

  async create(id: string, participantsId: string[], name: string) {
    participantsId.forEach((participant) => {
      const receiverSocketId = this.findReceiverSocket(participant);
      if (receiverSocketId) {
        this.server.sockets.sockets.get(receiverSocketId)?.join(id);
      }
    });
    this.server.to(id).emit(ChatWsOutgoingEventsEnum.CREATED, {
      id,
      name,
    });
  }

  private findReceiverSocket(receiverId: string): string | null {
    for (const [socketId, socket] of this.server.sockets.sockets) {
      if (socket['user'].id === receiverId) {
        return socketId;
      }
    }
    return null;
  }

  async handleConnection(client: Socket) {
    const context = { switchToWs: () => ({ getClient: () => client }) } as any;
    try {
      await this.authGuard.validateWsRequest(context);
    } catch {
      client.disconnect();
      return;
    }
    const userId = client['user'].id;
    let currentPage = 1;
    while (true) {
      const { data: userChats, info } = await this.chatsService.findAll({
        userId,
        page: currentPage,
        take: 20,
      });
      for (const chat of userChats) {
        client.join(chat.id);
      }

      if (currentPage >= info.totalPages) break;
      currentPage++;
    }
  }

  remove(id: string) {
    this.server.to(id).emit(ChatWsOutgoingEventsEnum.DELETED, id);
    this.server.in(id).socketsLeave(id);
  }
}
