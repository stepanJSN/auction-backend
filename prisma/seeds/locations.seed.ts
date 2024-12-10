import { prismaInstance } from '../seed';
import { getData } from './helpers/getData';

type LocationType = {
  id: number;
  name: string;
  type: string;
};

export async function seedLocations() {
  const locationsUrl = process.env.API_URL + 'location?page=';
  await prismaInstance.locations.deleteMany({});

  await getData<LocationType>(locationsUrl, async (locationChunk) => {
    const mappedLocations = locationChunk.map((location) => ({
      id: location.id,
      name: location.name,
      type: location.type,
    }));
    await prismaInstance.locations.createMany({ data: mappedLocations });
  });
}
