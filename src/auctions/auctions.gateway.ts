import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { AuctionsFinishedEvent } from './events/auction-finished.event';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { NewBidEvent } from 'src/bids/events/new-bid.event';
import { AuctionChangedEvent } from './events/auction-changed.event';

@WebSocketGateway()
export class AuctionsGateway {
  @WebSocketServer()
  private server: Server;

  @OnEvent('auction.finished')
  notifyClientsAboutAuctionFinish(event: AuctionsFinishedEvent) {
    this.server.to(`auction-${event.id}`).emit('auctionFinished', {
      auctionId: event.id,
      message: 'Auction has been completed.',
    });
  }

  @OnEvent('auction.changed')
  notifyClientsAboutAuctionChanged({ id, ...restData }: AuctionChangedEvent) {
    this.server.to(`auction-${id}`).emit('auctionChanged', {
      auctionId: id,
      ...restData,
    });
  }

  @OnEvent('bid.new')
  notifyClientsAboutNewBid(event: NewBidEvent) {
    this.server.to(`auction-${event.auctionId}`).emit('newBid', {
      auctionId: event.auctionId,
      bidAmount: event.bidAmount,
    });
  }

  @SubscribeMessage('subscribeToAuction')
  handleSubscription(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`auction-${id}`);
  }
}
