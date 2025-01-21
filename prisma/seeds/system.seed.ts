import { prismaInstance } from '../seed';

export async function seedSystem() {
  await prismaInstance.system.upsert({
    where: { key: 'exchange_rate' },
    update: {},
    create: {
      key: 'exchange_rate',
      value: '1',
    },
  });
}
