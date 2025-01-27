import { Gender } from '@prisma/client';

export const MOCK_EMAIL = 'test@example.com';
export const MOCK_PASSWORD = 'testPassword';
export const MOCK_HASHED_PASSWORD = 'hashedPassword';
export const MOCK_ID = 'id123';
export const MOCK_CARD_ID = 'cardId123';
export const MOCK_USER_ID = 'userId123';
export const MOCK_AUCTION_ID = 'auctionId123';
export const MOCK_ACCESS_TOKEN = 'accessToken';
export const MOCK_REFRESH_TOKEN = 'refreshToken';
export const MOCK_DATE = new Date();
export const MOCK_IMAGE_URL = 'https://example.com/image.jpg';
export const MOCK_CARD = {
  id: MOCK_CARD_ID,
  created_at: MOCK_DATE,
  name: 'Test Card',
  image_url: MOCK_IMAGE_URL,
  location_id: 1,
  type: 'test-type',
  gender: Gender.female,
  is_active: true,
  is_created_by_admin: true,
};
export const MOCK_PAGINATION = {
  page: 1,
  take: 20,
};
