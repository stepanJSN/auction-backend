import { prismaInstance } from '../seed';
import { getData } from './getData';

type LocationType = {
  id: number;
  name: string;
  episode: string;
};

export async function seedEpisodes() {
  const episodesUrl = process.env.API_URL + 'episode';
  const allEpisodes = await getData<LocationType>(episodesUrl);
  const mappedEpisodes = allEpisodes.map((episode) => ({
    id: episode.id,
    name: episode.name,
    code: episode.episode,
  }));

  await prismaInstance.episodes.deleteMany({});
  await prismaInstance.episodes.createMany({ data: mappedEpisodes });
}
