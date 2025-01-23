import { Test } from '@nestjs/testing';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { MOCK_AUCTION_ID, MOCK_USER_ID } from 'config/mock-test-data';

describe('BidsController', () => {
  let bidsController: BidsController;
  let bidsService: jest.Mocked<BidsService>;

  beforeEach(async () => {
    const mockedBidsService = {
      create: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [BidsController],
      providers: [
        {
          provide: BidsService,
          useValue: mockedBidsService,
        },
      ],
    }).compile();

    bidsController = module.get(BidsController);
    bidsService = module.get(BidsService);
  });

  describe('signIn', () => {
    it('should create a new bid', async () => {
      const mockBidPayload = {
        auctionId: MOCK_AUCTION_ID,
        bidAmount: 100,
      };
      bidsService.create.mockResolvedValue(mockBidPayload.bidAmount);

      expect(await bidsController.create(MOCK_USER_ID, mockBidPayload)).toEqual(
        mockBidPayload.bidAmount,
      );

      expect(bidsService.create).toHaveBeenCalledTimes(1);
      expect(bidsService.create).toHaveBeenCalledWith({
        userId: MOCK_USER_ID,
        ...mockBidPayload,
      });
    });
  });
});
