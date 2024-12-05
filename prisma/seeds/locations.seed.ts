import { prismaInstance } from '../seed';
import { getData } from './getData';

type LocationType = {
  id: number;
  name: string;
  type: string;
};

export async function seedLocations() {
  const locationsUrl = process.env.API_URL + 'location';
  const allLocations = await getData<LocationType>(locationsUrl);
  const mappedLocations = allLocations.map((location) => ({
    id: location.id,
    name: location.name,
    type: location.type,
  }));

  await prismaInstance.locations.deleteMany({});
  await prismaInstance.locations.createMany({ data: mappedLocations });
}
