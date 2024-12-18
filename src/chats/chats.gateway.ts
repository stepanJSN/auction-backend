import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { Server, Socket } from 'socket.io';
import { UpdateMessageDto } from './dto/update-message.dto';
import { FindAllChatMessagesDto } from './dto/find-all-chat-messages.dto';
import { FindAllChatsDto } from './dto/find-all-chats.dto';

@UseGuards(AuthGuard)
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }),
)
@WebSocketGateway()
export class ChatsGateway {
  @WebSocketServer()
  private server: Server;
  constructor(private readonly chatsService: ChatsService) {}

  @SubscribeMessage('createChat')
  create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = this.generateRoomName(createMessageDto.receiverId, userId);
    client.join(roomName);
    const receiverSocketId = this.findReceiverSocket(
      createMessageDto.receiverId,
    );
    if (receiverSocketId) {
      this.server.sockets.sockets.get(receiverSocketId)?.join(roomName);
    }
    this.server.to(roomName).emit('newMessage', createMessageDto);
    return this.chatsService.create({ ...createMessageDto, senderId: userId });
  }

  private findReceiverSocket(receiverId: string): string | null {
    for (const [socketId, socket] of this.server.sockets.sockets) {
      if (socket.data.id === receiverId) {
        return socketId;
      }
    }
    return null;
  }

  @SubscribeMessage('findAllChats')
  async findAll(
    @MessageBody() findAllChats: FindAllChatsDto,
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.emit(
      'chats',
      await this.chatsService.findAll(
        userId,
        findAllChats.page ?? 1,
        findAllChats.take ?? 50,
      ),
    );
  }

  @SubscribeMessage('findChat')
  async findOne(
    @MessageBody() findAllChatMessages: FindAllChatMessagesDto,
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.emit(
      'chat',
      await this.chatsService.findAllChatMessages({
        thisUserId: userId,
        peerId: findAllChatMessages.peerId,
        page: findAllChatMessages.page ?? 1,
        take: findAllChatMessages.take ?? 50,
      }),
    );
  }

  @SubscribeMessage('subscribeToChats')
  async subscribe(
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.data.id = userId;
    const { data: userChats } = await this.chatsService.findAll(userId);
    for (const chat of userChats) {
      const secondUserId = chat.peer.id;
      const roomName = this.generateRoomName(userId, secondUserId);
      client.join(roomName);
    }

    return 'subscribed';
  }

  private generateRoomName(userId1: string, userId2: string): string {
    return `chat-${[userId1, userId2].sort().join('-')}`;
  }

  @SubscribeMessage('newMessage')
  updateChat(
    @MessageBody() createMessageDto: CreateMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    const roomName = this.generateRoomName(createMessageDto.receiverId, userId);
    this.server.to(roomName).emit('newMessage', createMessageDto);
    return this.chatsService.create({ ...createMessageDto, senderId: userId });
  }

  @SubscribeMessage('editMessage')
  async editMessage(@MessageBody() { messageId, message }: UpdateMessageDto) {
    const updatedMessage = await this.chatsService.update(messageId, message);
    const roomName = this.generateRoomName(
      updatedMessage.receiver_id,
      updatedMessage.sender_id,
    );
    this.server.to(roomName).emit('updatedMessage', updatedMessage);
  }

  @SubscribeMessage('deleteMessage')
  async remove(@MessageBody('messageId') id: string) {
    const deletedMessage = await this.chatsService.remove(id);
    const roomName = this.generateRoomName(
      deletedMessage.receiver_id,
      deletedMessage.sender_id,
    );
    this.server.to(roomName).emit('deletedMessage', deletedMessage);
  }
}
