import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
// import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationsRepository } from './locations.repository';
import { FindAllLocationsDto } from './dto/find-all-locations.dto';

@Injectable()
export class LocationsService {
  constructor(private locationsRepository: LocationsRepository) {}

  create(createLocationDto: CreateLocationDto) {
    const locations = this.findAll({ name: createLocationDto.name });
    if (locations) {
      throw new BadRequestException('Location with this name already exists');
    }

    return this.locationsRepository.create(createLocationDto);
  }

  findAll(findAllLocationsDto: FindAllLocationsDto) {
    return this.locationsRepository.findAll(findAllLocationsDto);
  }

  // findOne(id: number) {
  //   return this.locationsRepository.findOne(id);
  // }

  // update(id: number, updateLocationDto: UpdateLocationDto) {
  //   return `This action updates a #${id} location`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} location`;
  // }
}
