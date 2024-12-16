import { Role } from '@prisma/client';
import { CreateAuctionDto } from '../dto/create-auction.dto';

export type CreateAuctionServiceType = CreateAuctionDto & {
  createdBy: string;
  role: Role;
};
