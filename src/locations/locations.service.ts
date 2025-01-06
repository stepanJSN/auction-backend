import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationsRepository } from './locations.repository';
import { FindAllLocationsDto } from './dto/find-all-locations.dto';

@Injectable()
export class LocationsService {
  constructor(private locationsRepository: LocationsRepository) {}

  private async checkLocationName(name: string, id?: number) {
    const { locations } = await this.locationsRepository.findAll({ name });
    if (
      (!id && locations.length > 0) ||
      (locations.length > 0 && locations[0].id !== id)
    ) {
      throw new ConflictException('Location with this name already exists');
    }
  }

  async create(createLocationDto: CreateLocationDto) {
    await this.checkLocationName(createLocationDto.name);

    return this.locationsRepository.create(createLocationDto);
  }

  async findAll({
    page = 1,
    take = 20,
    ...findAllLocationsDto
  }: FindAllLocationsDto) {
    const { locations, totalCount } = await this.locationsRepository.findAll({
      page,
      take,
      ...findAllLocationsDto,
    });
    return {
      data: locations,
      info: {
        page: page,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  }

  async findOne(id: number) {
    const location = await this.locationsRepository.findOne(id);
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async update(id: number, updateLocationDto: UpdateLocationDto) {
    await this.checkLocationName(updateLocationDto.name, id);
    return this.locationsRepository.update(id, updateLocationDto);
  }

  remove(id: number) {
    return this.locationsRepository.delete(id);
  }
}
