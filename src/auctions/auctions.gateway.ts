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
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { AuctionsService } from './auctions.service';
import { CurrentUser } from 'src/decorators/user.decorator';
import {
  AuctionsWsIncomingEventsEnum,
  AuctionsWsOutgoingEventsEnum,
} from './enums/auctions-ws-events.enum';
import { AuctionEvent } from './enums/auction-event.enum';
import { BidEvent } from 'src/bids/enums/bid-event.enum';

@WebSocketGateway()
export class AuctionsGateway {
  @WebSocketServer()
  private server: Server;
  constructor(private readonly auctionsService: AuctionsService) {}

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

  @UseGuards(AuthGuard)
  @SubscribeMessage(AuctionsWsIncomingEventsEnum.SUBSCRIBE)
  async handleSubscription(
    @MessageBody('id') id: string,
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`auction-${id}`);

    const auction = await this.auctionsService.findOne(id, userId);
    client.emit(AuctionsWsOutgoingEventsEnum.SUBSCRIBED, auction);
  }
}
