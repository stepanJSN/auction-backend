import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AuctionsFinishedEvent } from './events/auction-finished.event';
import { Server } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { NewBidEvent } from 'src/bids/events/new-bid.event';
import { AuctionChangedEvent } from './events/auction-changed.event';
import { AuctionsWsOutgoingEventsEnum } from './enums/auctions-ws-events.enum';
import { AuctionEvent } from './enums/auction-event.enum';
import { BidEvent } from 'src/bids/enums/bid-event.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AuctionsGateway {
  @WebSocketServer()
  private server: Server;

  @OnEvent(AuctionEvent.FINISHED)
  notifyClientsAboutAuctionFinish(event: AuctionsFinishedEvent) {
    this.server.emit(`auction-${event.id}`, {
      type: AuctionsWsOutgoingEventsEnum.FINISHED,
      payload: {
        id: event.id,
      },
    });
  }

  @OnEvent(AuctionEvent.CHANGED)
  notifyClientsAboutAuctionChanged({ id, ...restData }: AuctionChangedEvent) {
    this.server.emit(`auction-${id}`, {
      type: AuctionsWsOutgoingEventsEnum.CHANGED,
      payload: {
        id,
        ...restData,
      },
    });
  }

  @OnEvent(BidEvent.NEW)
  notifyClientsAboutNewBid(event: NewBidEvent) {
    this.server.emit(`auction-${event.auctionId}`, {
      type: AuctionsWsOutgoingEventsEnum.NEW_BID,
      payload: {
        id: event.auctionId,
        bidAmount: event.bidAmount,
      },
    });
  }
}
