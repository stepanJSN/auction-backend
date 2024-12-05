import { PrismaClient } from '@prisma/client';
import { seedLocation } from './seeds/location.seed';

export const prismaInstance = new PrismaClient();

async function main() {
  await seedLocation();
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
