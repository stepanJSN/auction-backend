import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AuctionsFinishedEvent } from './events/auction-finished.event';
import { Server } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { NewBidEvent } from 'src/bids/events/new-bid.event';
import { AuctionChangedEvent } from './events/auction-changed.event';
import { AuctionsWsOutgoingEventsEnum } from './enums/auctions-ws-events.enum';
import { AuctionEvent } from './enums/auction-event.enum';
import { BidEvent } from 'src/bids/enums/bid-event.enum';

@WebSocketGateway()
export class AuctionsGateway {
  @WebSocketServer()
  private server: Server;

  @OnEvent(AuctionEvent.FINISHED)
  notifyClientsAboutAuctionFinish(event: AuctionsFinishedEvent) {
    this.server
      .to(`auction-${event.id}`)
      .emit(AuctionsWsOutgoingEventsEnum.FINISHED, {
        auctionId: event.id,
        message: 'Auction has been completed.',
      });
  }

  @OnEvent(AuctionEvent.CHANGED)
  notifyClientsAboutAuctionChanged({ id, ...restData }: AuctionChangedEvent) {
    this.server.to(`auction-${id}`).emit(AuctionsWsOutgoingEventsEnum.CHANGED, {
      auctionId: id,
      ...restData,
    });
  }

  @OnEvent(BidEvent.NEW)
  notifyClientsAboutNewBid(event: NewBidEvent) {
    this.server
      .to(`auction-${event.auctionId}`)
      .emit(AuctionsWsOutgoingEventsEnum.NEW_BID, {
        auctionId: event.auctionId,
        bidAmount: event.bidAmount,
      });
  }

  async handleSubscription(userId: string, auctionId: string) {
    const userSocketId = this.findUserSocket(userId);
    this.server.sockets.sockets.get(userSocketId)?.join(`auction-${auctionId}`);
  }

  private findUserSocket(userId: string): string | null {
    for (const [socketId, socket] of this.server.sockets.sockets) {
      if (socket['user'].id === userId) {
        return socketId;
      }
    }
    return null;
  }
}
