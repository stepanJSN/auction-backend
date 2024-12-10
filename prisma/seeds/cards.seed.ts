import { Gender } from '@prisma/client';
import { prismaInstance } from '../seed';
import { getData } from './helpers/getData';
import { saveImage } from './helpers/saveImage';

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
  const charactersUrl = process.env.API_URL + 'character?page=';
  await prismaInstance.cards.deleteMany({});

  async function handleCharactersChunk(charactersChunk: CharacterType[]) {
    const cardsPromises = charactersChunk.map(async (character) => {
      const imageUrl = await saveImage(character.image);
      const episodesCards = character.episode.map((episode) => ({
        id: +episode.split('/').pop(),
      }));

      await prismaInstance.cards.create({
        data: {
          name: character.name,
          type: character.type,
          gender: character.gender.toLowerCase() as Gender,
          location_id: character.location.url
            ? +character.location.url.split('/').pop()
            : null,
          image_url: imageUrl,
          created_at: character.created,
          episodes: {
            connect: episodesCards,
          },
        },
      });
    });
    await Promise.all(cardsPromises);
  }

  await getData<CharacterType>(charactersUrl, handleCharactersChunk);
}
