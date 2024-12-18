export type FindAllUsersWithSetType = {
  cardsId: string[];
  forEachUserWithSet: (userId: string) => void;
};
