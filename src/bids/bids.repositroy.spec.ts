import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { BidsRepository } from './bids.repository';

describe('BidsRepository', () => {
  let bidsRepository: BidsRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BidsRepository, PrismaService],
    }).compile();

    bidsRepository = module.get(BidsRepository);
    prismaService = module.get(PrismaService);
  });

  it('should create a new bid successfully', async () => {
    const mockBidData = {
      userId: 'user123',
      auctionId: 'auction456',
      bidAmount: 100,
    };

    const mockCreatedBid = {
      id: 'bid789',
      user_id: mockBidData.userId,
      auction_id: mockBidData.auctionId,
      bid_amount: mockBidData.bidAmount,
      created_at: new Date(),
    };

    jest.spyOn(prismaService.bids, 'create').mockResolvedValue(mockCreatedBid);

    const result = await bidsRepository.create(mockBidData);

    expect(prismaService.bids.create).toHaveBeenCalledTimes(1);
    expect(prismaService.bids.create).toHaveBeenCalledWith({
      data: {
        user_id: mockBidData.userId,
        auction_id: mockBidData.auctionId,
        bid_amount: mockBidData.bidAmount,
      },
    });

    expect(result).toEqual(mockCreatedBid);
  });
});
