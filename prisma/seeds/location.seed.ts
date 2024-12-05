import { prismaInstance } from '../seed';
import { getData } from './getData';

type LocationType = {
  name: string;
  type: string;
};

export async function seedLocation() {
  const locationsUrl = process.env.API_URL + 'location';
  const allLocations = await getData<LocationType>(locationsUrl);
  const mappedLocations = allLocations.map((location) => ({
    name: location.name,
    type: location.type,
  }));

  await prismaInstance.locations.deleteMany({});
  await prismaInstance.locations.createMany({ data: mappedLocations });
}
