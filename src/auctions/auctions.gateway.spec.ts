import { AuctionsGateway } from './auctions.gateway';
import { Test } from '@nestjs/testing';
import { MOCK_DATE } from 'config/mock-test-data';
import { Server } from 'socket.io';
import { AuctionsWsOutgoingEventsEnum } from './enums/auctions-ws-events.enum';

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
  })),
}));

describe('AuctionsGateway', () => {
  let auctionsGateway: AuctionsGateway;
  let socketServer: Partial<Server>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuctionsGateway],
    }).compile();

    auctionsGateway = module.get(AuctionsGateway);
    socketServer = new Server() as unknown as jest.Mocked<Partial<Server>>;
    (auctionsGateway as any).server = socketServer;
  });

  describe('notifyClientsAboutAuctionFinish', () => {
    it('should emit FINISHED event when auction is finished', () => {
      const auctionsFinishedEvent = {
        id: 'auctionId',
        winnerId: 'winnerId',
        sellerId: 'sellerId',
        cardInstanceId: 'cardInstanceId',
        highestBid: 100,
      };
      auctionsGateway.notifyClientsAboutAuctionFinish(auctionsFinishedEvent);
      expect(socketServer.emit).toHaveBeenCalledWith(
        `auction-${auctionsFinishedEvent.id}`,
        {
          type: AuctionsWsOutgoingEventsEnum.FINISHED,
          payload: {
            id: auctionsFinishedEvent.id,
          },
        },
      );
    });
  });

  describe('notifyClientsAboutAuctionChanged', () => {
    it('should emit CHANGED event when auction is changed', () => {
      const auctionsChangedEvent = {
        id: 'auctionId',
        startingBid: 150,
      };
      auctionsGateway.notifyClientsAboutAuctionChanged(auctionsChangedEvent);
      expect(socketServer.emit).toHaveBeenCalledWith(
        `auction-${auctionsChangedEvent.id}`,
        {
          type: AuctionsWsOutgoingEventsEnum.CHANGED,
          payload: {
            ...auctionsChangedEvent,
          },
        },
      );
    });
  });

  describe('notifyClientsAboutNewBid', () => {
    it('should emit NEW_BID event when someone make a bid', () => {
      const auctionsNewBidEvent = {
        auctionId: 'auctionId',
        bidAmount: 50,
        createdAt: MOCK_DATE,
      };
      auctionsGateway.notifyClientsAboutNewBid(auctionsNewBidEvent);
      expect(socketServer.emit).toHaveBeenCalledWith(
        `auction-${auctionsNewBidEvent.auctionId}`,
        {
          type: AuctionsWsOutgoingEventsEnum.NEW_BID,
          payload: {
            id: auctionsNewBidEvent.auctionId,
            bidAmount: auctionsNewBidEvent.bidAmount,
          },
        },
      );
    });
  });
});
