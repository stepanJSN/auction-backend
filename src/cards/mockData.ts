import { MOCK_CARD } from 'config/mock-test-data';
import { Readable } from 'stream';

export const createCardDto = {
  name: MOCK_CARD.name,
  type: MOCK_CARD.type,
  locationId: MOCK_CARD.location_id,
  gender: MOCK_CARD.gender,
  isActive: MOCK_CARD.is_active,
  episodesId: [1, 2, 3],
};

export const mockCardWithEpisodesAndLocation = {
  ...MOCK_CARD,
  episodes: [
    {
      id: 1,
      name: 'episode 1',
      code: '1234',
    },
  ],
  location: {
    id: 1,
    name: 'location 1',
    type: 'location type 1',
  },
};

export const mockImage: Express.Multer.File = {
  originalname: 'image.png',
  buffer: Buffer.from('image'),
  fieldname: '',
  encoding: '',
  mimetype: '',
  size: 0,
  stream: new Readable(),
  destination: '',
  filename: '',
  path: '',
};
