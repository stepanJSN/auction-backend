import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllLocationsDto } from './dto/find-all-locations.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsRepository {
  constructor(private prisma: PrismaService) {}

  create(createLocationDto: CreateLocationDto) {
    return this.prisma.locations.create({
      data: createLocationDto,
    });
  }

  async findAll({ name, page = 1, take = 10 }: FindAllLocationsDto) {
    const conditions = {
      name: {
        contains: name,
      },
    };
    const [locations, totalCount] = await this.prisma.$transaction([
      this.prisma.locations.findMany({
        where: conditions,
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.locations.count({ where: conditions }),
    ]);

    return { locations, totalCount };
  }

  findOne(id: number) {
    return this.prisma.locations.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: number, updateLocationDto: UpdateLocationDto) {
    return this.prisma.locations.update({
      where: { id },
      data: updateLocationDto,
    });
  }

  delete(id: number) {
    return this.prisma.locations.delete({ where: { id } });
  }
}
