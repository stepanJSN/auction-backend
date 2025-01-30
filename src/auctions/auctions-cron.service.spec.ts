import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AuctionsCronService } from './auctions-cron.service';
import { AuctionsRepository } from './auctions.repository';
import { AuctionsService } from './auctions.service';

describe('AuctionsCronService', () => {
  let auctionsCronService: AuctionsCronService;
  let auctionRepository: DeepMockProxy<AuctionsRepository>;
  let auctionService: DeepMockProxy<AuctionsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuctionsCronService,
        {
          provide: AuctionsRepository,
          useValue: mockDeep<AuctionsRepository>(),
        },
        {
          provide: AuctionsService,
          useValue: mockDeep<AuctionsService>(),
        },
      ],
    }).compile();

    auctionsCronService = module.get(AuctionsCronService);
    auctionRepository = module.get(AuctionsRepository);
    auctionService = module.get(AuctionsService);
  });

  describe('checkExpiredAuctions', () => {
    const MILLISECONDS_IN_A_MINUTE = 60 * 1000;
    it('should check for expired auctions and finish them', async () => {
      const expiredAuctions = [
        {
          id: 'auction1Id',
          end_time: new Date(
            new Date().getTime() - 1 * MILLISECONDS_IN_A_MINUTE,
          ),
        },
        {
          id: 'auction1Id',
          end_time: new Date(
            new Date().getTime() - 0.5 * MILLISECONDS_IN_A_MINUTE,
          ),
        },
      ];

      auctionRepository.findFinishedByNow.mockResolvedValue(
        expiredAuctions as any,
      );

      await auctionsCronService.checkExpiredAuctions();

      expect(auctionService.finishAuction).toHaveBeenCalledTimes(2);
      expect(auctionService.finishAuction).toHaveBeenCalledWith(
        expiredAuctions[0].id,
      );
      expect(auctionService.finishAuction).toHaveBeenCalledWith(
        expiredAuctions[1].id,
      );
    });
  });
});
