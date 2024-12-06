import { hash } from 'bcrypt';
import { prismaInstance } from '../seed';

export async function seedAdmin() {
  await prismaInstance.users.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      email: 'admin@gmail.com',
      name: 'Admin',
      surname: 'Admin',
      role: 'Admin',
      password: await hash('admin1234', 10),
    },
    create: {
      email: 'admin@gmail.com',
      name: 'Admin',
      surname: 'Admin',
      role: 'Admin',
      password: await hash('admin1234', 10),
    },
  });
}
