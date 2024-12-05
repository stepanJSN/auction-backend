import { PrismaClient } from '@prisma/client';
import { seedLocations } from './seeds/locations.seed';
import { seedEpisodes } from './seeds/episodes.seed';

export const prismaInstance = new PrismaClient();

async function main() {
  await seedLocations();
  await seedEpisodes();
}
main()
  .then(async () => {
    await prismaInstance.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prismaInstance.$disconnect();
    process.exit(1);
  });
