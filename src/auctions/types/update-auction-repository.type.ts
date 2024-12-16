import { UpdateAuctionDto } from '../dto/update-auction.dto';

export type UpdateAuctionRepositoryType = UpdateAuctionDto & {
  isCompleted?: boolean;
};
