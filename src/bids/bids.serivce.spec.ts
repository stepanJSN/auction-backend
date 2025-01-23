import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AuctionsService } from 'src/auctions/auctions.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { BidsRepository } from './bids.repository';
import { BidsService } from './bids.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BidExceptionCode } from './enums/bid-exception.enum';
import {
  MOCK_AUCTION_ID,
  MOCK_CARD,
  MOCK_DATE,
  MOCK_USER_ID,
} from 'config/mock-test-data';
import { BidEvent } from './enums/bid-event.enum';
import { NewBidEvent } from './events/new-bid.event';

const MOCK_BID_ID = 'bidId123';

describe('BidsService', () => {
  let bidsService: BidsService;
  let bidsRepository: jest.Mocked<BidsRepository>;
  let auctionsService: jest.Mocked<AuctionsService>;
  let eventEmitter: EventEmitter2;
  let transactionsService: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    const mockedAuctionsService = {
      findOne: jest.fn(),
    };
    const mockedTransactionsService = {
      calculateBalance: jest.fn(),
    };
    const mockedBidsRepository = {
      create: jest.fn(),
    };
    const mockedEventEmitter = {
      emit: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        BidsService,
        { provide: BidsRepository, useValue: mockedBidsRepository },
        { provide: AuctionsService, useValue: mockedAuctionsService },
        { provide: EventEmitter2, useValue: mockedEventEmitter },
        { provide: TransactionsService, useValue: mockedTransactionsService },
      ],
    }).compile();

    bidsService = module.get(BidsService);
    bidsRepository = module.get(BidsRepository);
    auctionsService = module.get(AuctionsService);
    eventEmitter = module.get(EventEmitter2);
    transactionsService = module.get(TransactionsService);
  });

  describe('create', () => {
    const mockAuctionData = {
      card: MOCK_CARD,
      is_completed: false,
      is_this_user_auction: false,
      highest_bid: {
        amount: 70,
        is_this_user_bid: true,
      },
      min_bid_step: 10,
      max_bid: 100,
      min_length: 5,
      end_time: new Date(),
      starting_bid: 50,
      id: MOCK_AUCTION_ID,
      location_id: 1,
      user_id: MOCK_USER_ID,
    };
    const mockBidPayload = {
      userId: MOCK_USER_ID,
      auctionId: MOCK_AUCTION_ID,
      bidAmount: 100,
    };
    const balance = {
      available: 100,
      total: 100,
    };

    it('should throw NotFoundException if auction is not found', async () => {
      auctionsService.findOne.mockResolvedValue(null);

      await expect(bidsService.create(mockBidPayload)).rejects.toThrow(
        new NotFoundException({
          code: BidExceptionCode.AUCTION_NOT_FOUND,
          message: 'The auction not found!',
        }),
      );
    });

    it('should throw BadRequestException with AUCTION_COMPLETED message if auction is completed', async () => {
      auctionsService.findOne.mockResolvedValue({
        ...mockAuctionData,
        is_completed: true,
      });

      await expect(bidsService.create(mockBidPayload)).rejects.toThrow(
        new BadRequestException({
          code: BidExceptionCode.AUCTION_COMPLETED,
          message: 'The auction has already ended!',
        }),
      );
    });

    it('should throw BadRequestException with USER_ALREADY_HAS_CARD message if user already has the card', async () => {
      auctionsService.findOne.mockResolvedValue({
        ...mockAuctionData,
        card: {
          ...MOCK_CARD,
          is_owned: true,
        },
      });

      await expect(bidsService.create(mockBidPayload)).rejects.toThrow(
        new BadRequestException({
          code: BidExceptionCode.USER_ALREADY_HAS_CARD,
          message: 'You already have this card!',
        }),
      );
    });

    it('should throw BadRequestException with INSUFFICIENT_BALANCE message if user does not have enough balance', async () => {
      auctionsService.findOne.mockResolvedValue(mockAuctionData);
      transactionsService.calculateBalance.mockResolvedValue({
        total: 0,
        available: 0,
      });

      await expect(bidsService.create(mockBidPayload)).rejects.toThrow(
        new BadRequestException({
          code: BidExceptionCode.INSUFFICIENT_BALANCE,
          message: 'You do not have enough money to make this bid!',
        }),
      );
    });

    it('should throw BadRequestException with BID_BELOW_STARTING message if bid is below starting bid', async () => {
      transactionsService.calculateBalance.mockResolvedValue(balance);
      auctionsService.findOne.mockResolvedValue({
        ...mockAuctionData,
        highest_bid: null,
        starting_bid: 150,
      });

      await expect(bidsService.create(mockBidPayload)).rejects.toThrow(
        new BadRequestException({
          code: BidExceptionCode.BID_BELOW_STARTING,
          message: 'You cannot bid less than starting bid!',
        }),
      );
    });

    it('should throw BadRequestException with BID_EXCEEDS_MAX message if bid exceeds max bid', async () => {
      transactionsService.calculateBalance.mockResolvedValue(balance);
      auctionsService.findOne.mockResolvedValue({
        ...mockAuctionData,
        max_bid: 50,
      });

      await expect(bidsService.create(mockBidPayload)).rejects.toThrow(
        new BadRequestException({
          code: BidExceptionCode.BID_EXCEEDS_MAX,
          message: 'Your bid exceeds the maximum allowed!',
        }),
      );
    });

    it('should throw BadRequestException with BID_NOT_EXCEEDS_MINIMUM_STEP message if bid does not exceed minimum step', async () => {
      transactionsService.calculateBalance.mockResolvedValue(balance);
      auctionsService.findOne.mockResolvedValue({
        ...mockAuctionData,
        min_bid_step: 50,
      });

      await expect(bidsService.create(mockBidPayload)).rejects.toThrow(
        new BadRequestException({
          code: BidExceptionCode.BID_NOT_EXCEEDS_MINIMUM_STEP,
          message: 'Your bid does not exceed the minimum bid step!',
        }),
      );
    });

    it('should create bid and emit event', async () => {
      auctionsService.findOne.mockResolvedValue(mockAuctionData);
      transactionsService.calculateBalance.mockResolvedValue(balance);
      bidsRepository.create.mockResolvedValue({
        id: MOCK_BID_ID,
        created_at: MOCK_DATE,
        user_id: MOCK_USER_ID,
        auction_id: MOCK_AUCTION_ID,
        bid_amount: mockBidPayload.bidAmount,
      });
      expect(await bidsService.create(mockBidPayload)).toEqual(
        mockBidPayload.bidAmount,
      );
      expect(bidsRepository.create).toHaveBeenCalledTimes(1);
      expect(bidsRepository.create).toHaveBeenCalledWith(mockBidPayload);
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        BidEvent.NEW,
        new NewBidEvent({
          createdAt: MOCK_DATE,
          bidAmount: mockBidPayload.bidAmount,
          auctionId: MOCK_AUCTION_ID,
        }),
      );
    });
  });
});
