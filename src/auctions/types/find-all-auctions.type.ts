import { FindAllAuctionsDto } from '../dto/find-all-auction.dto';

export type FindAllAuctionsType = Omit<FindAllAuctionsDto, 'sortBy'> & {
  createdById?: string;
  participantId?: string;
  isCompleted?: boolean;
  cardId?: string;
  sortBy?: FindAllAuctionsDto['sortBy'] | 'startingBid';
};
