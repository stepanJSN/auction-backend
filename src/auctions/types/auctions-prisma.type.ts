export type AuctionsPrismaType = {
  id: string;
  starting_bid: number;
  min_bid_step: number;
  max_bid: number;
  max_length: string;
  created_at: string;
  created_by_id: string;
  is_completed: number;
  name: string;
  image_url: string;
  highest_bid: number | null;
};
