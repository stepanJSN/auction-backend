import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SystemRepository {
  constructor(private prisma: PrismaService) {}

  findOne(key: string) {
    return this.prisma.system.findUnique({ where: { key } });
  }

  async update(key: string, value: string) {
    try {
      return await this.prisma.system.update({
        where: { key },
        data: {
          value,
        },
      });
    } catch {
      throw new NotFoundException('Record with such key not found');
    }
  }
}
