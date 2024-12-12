import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AuctionsFinishedEvent } from './events/auction-finished.event';
import { Server } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway()
export class AuctionsGateway {
  @WebSocketServer()
  private server: Server;

  @OnEvent('auction.finished')
  notifyClients(event: AuctionsFinishedEvent) {
    this.server.to(`auction-${event.id}`).emit('auctionFinished', {
      auctionId: event.id,
      message: 'Auction has been completed.',
    });
  }
}
