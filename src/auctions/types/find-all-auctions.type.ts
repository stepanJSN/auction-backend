import { FindAllAuctionsDto } from '../dto/find-all-auction.dto';

export type FindAllAuctionsType = FindAllAuctionsDto & {
  userId?: string;
  isCompleted?: boolean;
};
