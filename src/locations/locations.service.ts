import {
  BadRequestException,
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

  private async checkLocationName(name: string) {
    const locations = await this.findAll({ name });
    if (locations) {
      throw new BadRequestException('Location with this name already exists');
    }
  }

  async create(createLocationDto: CreateLocationDto) {
    await this.checkLocationName(createLocationDto.name);

    return this.locationsRepository.create(createLocationDto);
  }

  async findAll(findAllLocationsDto: FindAllLocationsDto) {
    const { locations, totalCount } =
      await this.locationsRepository.findAll(findAllLocationsDto);
    return {
      data: locations,
      info: {
        page: findAllLocationsDto.page,
        totalCount,
        totalPages: Math.ceil(totalCount / findAllLocationsDto.take),
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
    await this.checkLocationName(updateLocationDto.name);
    return this.locationsRepository.update(id, updateLocationDto);
  }

  remove(id: number) {
    return this.locationsRepository.delete(id);
  }
}
