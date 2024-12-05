import { Gender } from '@prisma/client';
import { prismaInstance } from '../seed';
import { getData } from './getData';

type CharacterType = {
  name: string;
  type: string;
  gender: 'unknown' | 'Female' | 'Male' | 'Genderless';
  location: {
    url: string;
  };
  image: string;
  episode: string[];
  created: string;
};

export async function seedCards() {
  const charactersUrl = process.env.API_URL + 'character';
  await prismaInstance.cards.deleteMany({});

  async function handleCharactersChunk(charactersChunk: CharacterType[]) {
    const cardsPromises = charactersChunk.map(async (character) => {
      const { id } = await prismaInstance.cards.create({
        data: {
          name: character.name,
          type: character.type,
          gender: character.gender.toLowerCase() as Gender,
          location_id: character.location.url
            ? +character.location.url.split('/').pop()
            : null,
          image_url: character.image,
          created_at: character.created,
        },
      });
      const episodesCards = character.episode.map((episode) => ({
        card_id: id,
        episode_id: +episode.split('/').pop(),
      }));
      await prismaInstance.episodes_cards.createMany({ data: episodesCards });
    });
    await Promise.all(cardsPromises);
  }

  await getData<CharacterType>(charactersUrl, handleCharactersChunk);
}
