import { MOCK_CARD, MOCK_DATE } from 'config/mock-test-data';

export const CARD_1 = {
  ...MOCK_CARD,
  id: 'card1',
  name: 'Card 1',
};
export const CARD_2 = {
  ...MOCK_CARD,
  id: 'card2',
  name: 'Card 2',
};
export const SET_1 = {
  id: 'set1',
  name: 'Set 1',
  bonus: 10,
  created_at: MOCK_DATE,
  cards: [CARD_1, CARD_2],
};
export const SET_2 = {
  id: 'set2',
  name: 'Set 2',
  bonus: 20,
  created_at: MOCK_DATE,
  cards: [CARD_1, CARD_2],
};
