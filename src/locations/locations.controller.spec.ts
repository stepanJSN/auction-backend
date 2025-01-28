import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

describe('LocationsController', () => {
  let locationsController: LocationsController;
  let locationsService: DeepMockProxy<LocationsService>;
  const mockLocationResponse = {
    id: 1,
    name: 'Test Location',
    type: 'Planet',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        { provide: LocationsService, useValue: mockDeep<LocationsService>() },
      ],
    }).compile();

    locationsController = module.get(LocationsController);
    locationsService = module.get(LocationsService);
  });

  describe('create', () => {
    it('should create an location', async () => {
      const createLocationDto = {
        name: mockLocationResponse.name,
        type: mockLocationResponse.type,
      };
      locationsService.create.mockResolvedValue(mockLocationResponse);
      const response = await locationsController.create(createLocationDto);
      expect(locationsService.create).toHaveBeenCalledWith(createLocationDto);
      expect(response).toEqual(mockLocationResponse);
    });
  });

  describe('findAll', () => {
    it('should find all locations', async () => {
      const findAllLocationsDto = {
        name: 'Location',
        page: 1,
        limit: 10,
      };
      const mockFindAllPrismaResponse = {
        data: [mockLocationResponse],
        info: {
          page: 1,
          totalCount: 1,
          totalPages: 1,
        },
      };

      locationsService.findAll.mockResolvedValue(mockFindAllPrismaResponse);

      const result = await locationsController.findAll(findAllLocationsDto);
      expect(locationsService.findAll).toHaveBeenCalledWith(
        findAllLocationsDto,
      );
      expect(result).toEqual(mockFindAllPrismaResponse);
    });
  });

  describe('findOne', () => {
    it('should find one location', async () => {
      const id = 1;
      locationsService.findOne.mockResolvedValue(mockLocationResponse);
      const response = await locationsController.findOne(id);
      expect(locationsService.findOne).toHaveBeenCalledWith(id);
      expect(response).toEqual(mockLocationResponse);
    });
  });

  describe('update', () => {
    it('should update an location', async () => {
      const id = 1;
      const updateLocationDto = {
        name: 'Updated Location',
        type: mockLocationResponse.type,
      };
      locationsService.update.mockResolvedValue({
        ...mockLocationResponse,
        name: updateLocationDto.name,
      });
      const response = await locationsController.update(id, updateLocationDto);
      expect(locationsService.update).toHaveBeenCalledWith(
        id,
        updateLocationDto,
      );
      expect(response).toEqual({
        ...mockLocationResponse,
        name: updateLocationDto.name,
      });
    });
  });

  describe('remove', () => {
    it('should delete an location', async () => {
      const id = 1;
      locationsService.remove.mockResolvedValue(mockLocationResponse);
      const result = await locationsController.remove(id);
      expect(locationsService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockLocationResponse);
    });
  });
});
