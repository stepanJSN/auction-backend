import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { LocationsService } from './locations.service';

describe('LocationsService', () => {
  let locationsService: LocationsService;
  let locationsRepository: DeepMockProxy<LocationsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LocationsService, LocationsRepository],
    })
      .overrideProvider(LocationsRepository)
      .useValue(mockDeep<LocationsRepository>())
      .compile();

    locationsService = module.get(LocationsService);
    locationsRepository = module.get(LocationsRepository);
  });

  describe('create', () => {
    it('should throw ConflictException if location with this name already exists', async () => {
      const createLocationDto = {
        name: 'Location 0',
        type: 'Planet',
      };

      locationsRepository.findAll.mockResolvedValue({
        locations: [
          {
            id: 1,
            ...createLocationDto,
          },
        ],
        totalCount: 1,
      });
      await expect(locationsService.create(createLocationDto)).rejects.toThrow(
        new ConflictException('Location with this name already exists'),
      );

      expect(locationsRepository.findAll).toHaveBeenCalledWith({
        name: createLocationDto.name,
      });
    });
    it('should create a new location', async () => {
      const createLocationDto = {
        name: 'Location 1',
        type: 'Planet',
      };
      const mockCreatePrismaResponse = {
        id: 1,
        ...createLocationDto,
      };

      locationsRepository.findAll.mockResolvedValue({
        locations: [],
        totalCount: 0,
      });
      locationsRepository.create.mockResolvedValue(mockCreatePrismaResponse);

      const result = await locationsService.create(createLocationDto);

      expect(locationsRepository.findAll).toHaveBeenCalledWith({
        name: createLocationDto.name,
      });
      expect(locationsRepository.create).toHaveBeenCalledWith(
        createLocationDto,
      );
      expect(result).toEqual(mockCreatePrismaResponse);
    });
  });

  describe('findAll', () => {
    it('should find all locations', async () => {
      const findAllLocationsDto = {
        page: 1,
        take: 10,
        name: 'Location',
      };
      const mockFindAllPrismaResponse = {
        locations: [
          {
            id: 1,
            name: 'Location 1',
            type: 'Planet',
          },
        ],
        totalCount: 1,
      };

      locationsRepository.findAll.mockResolvedValue({
        locations: mockFindAllPrismaResponse.locations,
        totalCount: mockFindAllPrismaResponse.totalCount,
      });

      const result = await locationsService.findAll(findAllLocationsDto);

      expect(locationsRepository.findAll).toHaveBeenCalledWith(
        findAllLocationsDto,
      );
      expect(result).toEqual({
        data: mockFindAllPrismaResponse.locations,
        info: {
          page: findAllLocationsDto.page,
          totalCount: mockFindAllPrismaResponse.totalCount,
          totalPages: Math.ceil(
            mockFindAllPrismaResponse.totalCount / findAllLocationsDto.take,
          ),
        },
      });
    });
  });

  describe('findOne', () => {
    it('should find one location if it exists', async () => {
      const id = 1;
      const mockFindOnePrismaResponse = {
        id: 1,
        name: 'Location 1',
        type: 'Planet',
      };

      locationsRepository.findOne.mockResolvedValue(mockFindOnePrismaResponse);

      const result = await locationsService.findOne(id);

      expect(locationsRepository.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockFindOnePrismaResponse);
    });

    it('should throw NotFoundException if location does not exist', async () => {
      const id = 200;
      locationsRepository.findOne.mockResolvedValue(null);

      await expect(locationsService.findOne(id)).rejects.toThrow(
        new NotFoundException('Location not found'),
      );
    });
  });

  describe('update', () => {
    it('should update an location if the updated name does not match another location', async () => {
      const id = 1;
      const updateLocationDto = {
        name: 'Updated Location',
        type: 'Planet',
      };
      const mockUpdatePrismaResponse = {
        id,
        ...updateLocationDto,
      };

      locationsRepository.findAll.mockResolvedValue({
        locations: [
          {
            id: 1,
            ...updateLocationDto,
          },
        ],
        totalCount: 0,
      });
      locationsRepository.update.mockResolvedValue(mockUpdatePrismaResponse);

      const result = await locationsService.update(id, updateLocationDto);

      expect(locationsRepository.findAll).toHaveBeenCalledWith({
        name: updateLocationDto.name,
      });
      expect(locationsRepository.update).toHaveBeenCalledWith(
        id,
        updateLocationDto,
      );
      expect(result).toEqual(mockUpdatePrismaResponse);
    });

    it('should throw ConflictException if location with this name already exists', async () => {
      const id = 1;
      const updateLocationDto = {
        name: 'Location 2',
        type: 'Planet',
      };
      locationsRepository.findAll.mockResolvedValue({
        locations: [
          {
            id: 2,
            ...updateLocationDto,
          },
        ],
        totalCount: 1,
      });
      await expect(
        locationsService.update(id, updateLocationDto),
      ).rejects.toThrow(
        new ConflictException('Location with this name already exists'),
      );
      expect(locationsRepository.findAll).toHaveBeenCalledWith({
        name: updateLocationDto.name,
      });
    });
  });
});
