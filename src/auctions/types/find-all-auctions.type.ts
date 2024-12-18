import { FindAllAuctionsDto } from '../dto/find-all-auction.dto';

export type FindAllAuctionsType = FindAllAuctionsDto & {
  createdById?: string;
  participantId?: string;
  isUserLeader?: boolean;
  isCompleted?: boolean;
};
