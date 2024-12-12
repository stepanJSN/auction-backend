import { FindAllAuctionsDto } from '../dto/find-all-auction.dto';

export type FindAllAuctionsServiceType = FindAllAuctionsDto & {
  userId: string;
};
