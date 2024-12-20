import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  WsException,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { Server, Socket } from 'socket.io';
import { FindAllChatsDto } from './dto/find-all-chats.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import {
  ChatWsIncomingEventsEnum,
  ChatWsOutgoingEventsEnum,
} from './enums/chat-ws-events.enum';

@UseGuards(AuthGuard)
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }),
)
@WebSocketGateway()
export class ChatsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;
  constructor(
    private readonly chatsService: ChatsService,
    private readonly authGuard: AuthGuard,
  ) {}

  @SubscribeMessage(ChatWsIncomingEventsEnum.CREATE)
  async create(
    @MessageBody() createChatDto: CreateChatDto,
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const { id } = await this.chatsService.create({
      name: createChatDto.name,
      participants: createChatDto.participants,
      userId,
    });
    client.join(id);
    createChatDto.participants.forEach((participant) => {
      const receiverSocketId = this.findReceiverSocket(participant);
      if (receiverSocketId) {
        this.server.sockets.sockets.get(receiverSocketId)?.join(id);
      }
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

  @SubscribeMessage(ChatWsIncomingEventsEnum.GET_ALL)
  async findAll(
    @MessageBody() findAllChats: FindAllChatsDto,
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.emit(
      ChatWsOutgoingEventsEnum.ALL,
      await this.chatsService.findAll({
        userId,
        name: findAllChats.name,
        page: findAllChats.page,
        take: findAllChats.take,
      }),
    );
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
      });
      for (const chat of userChats) {
        client.join(chat.id);
      }

      if (currentPage >= info.totalPages) break;
      currentPage++;
    }
  }

  @SubscribeMessage(ChatWsIncomingEventsEnum.UPDATE)
  async update(@MessageBody() updateChatDto: UpdateChatDto) {
    await this.chatsService.update(updateChatDto);
  }

  @SubscribeMessage(ChatWsIncomingEventsEnum.DELETE)
  async remove(@MessageBody('id') id: string) {
    await this.chatsService.remove(id);
    this.server.to(id).emit(ChatWsOutgoingEventsEnum.DELETED, id);
    this.server.in(id).socketsLeave(id);
  }
}
