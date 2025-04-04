import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAuctionDto } from './create-auction.dto';

export class UpdateAuctionDto extends PartialType(
  OmitType(CreateAuctionDto, ['cardId']),
) {}
