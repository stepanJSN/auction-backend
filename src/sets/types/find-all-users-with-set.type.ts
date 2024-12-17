export type FindAllUsersWithSetType = {
  cards: { id: string }[];
  forEachUserWithSet: (userId: string) => void;
};
