import { CreateAuctionDto } from '../dto/create-auction.dto';

export type CreateAuctionRepositoryType = Omit<CreateAuctionDto, 'cardId'> & {
  cardInstanceId: string;
  createdBy: string;
};
