import { PrismaClient } from '@prisma/client';
import { seedLocations } from './seeds/locations.seed';
import { seedEpisodes } from './seeds/episodes.seed';
import { seedCards } from './seeds/cards.seed';
import { seedAdmin } from './seeds/admin.seed';
import { config } from 'dotenv';

config();
export const prismaInstance = new PrismaClient();

async function main() {
  await seedLocations();
  await seedEpisodes();
  await seedCards();
  await seedAdmin();
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
