import { prismaInstance } from '../seed';
import { getData } from './getData';

type EpisodeType = {
  id: number;
  name: string;
  episode: string;
};

export async function seedEpisodes() {
  const episodesUrl = process.env.API_URL + 'episode?page=';
  await prismaInstance.episodes.deleteMany({});

  await getData<EpisodeType>(episodesUrl, async (episodeChunk) => {
    const mappedEpisodes = episodeChunk.map((episode) => ({
      id: episode.id,
      name: episode.name,
      code: episode.episode,
    }));
    await prismaInstance.episodes.createMany({ data: mappedEpisodes });
  });
}
