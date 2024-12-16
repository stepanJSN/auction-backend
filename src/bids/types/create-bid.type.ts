import { CreateBidDto } from '../dto/create-bid.dto';

export type CreateBidType = CreateBidDto & {
  userId: string;
};
