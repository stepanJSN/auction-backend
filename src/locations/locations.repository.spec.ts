import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';

describe('LocationsRepository', () => {
  let locationsRepository: LocationsRepository;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LocationsRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    locationsRepository = module.get(LocationsRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new location', async () => {
      const createLocationDto = {
        name: 'Location 1',
        type: 'Planet',
      };
      const mockCreatePrismaResponse = {
        id: 1,
        ...createLocationDto,
      };

      prisma.locations.create.mockResolvedValue(mockCreatePrismaResponse);

      const result = await locationsRepository.create(createLocationDto);

      expect(prisma.locations.create).toHaveBeenCalledWith({
        data: createLocationDto,
      });
      expect(result).toEqual(mockCreatePrismaResponse);
    });
  });

  describe('findAll', () => {
    it('should return a list of locations', async () => {
      const findAllLocationsDto = {
        name: 'Location',
        page: 1,
        take: 10,
      };
      const mockFindManyPrismaResponse = [
        {
          id: 1,
          name: 'Location 1',
          type: 'Planet',
        },
        {
          id: 2,
          name: 'Location 2',
          type: 'Planet',
        },
      ];
      const conditions = {
        name: {
          contains: findAllLocationsDto.name,
        },
      };

      prisma.$transaction.mockResolvedValue([
        mockFindManyPrismaResponse,
        mockFindManyPrismaResponse.length,
      ]);

      const result = await locationsRepository.findAll(findAllLocationsDto);

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.locations.findMany({
          where: conditions,
          skip: (findAllLocationsDto.page - 1) * findAllLocationsDto.take,
          take: findAllLocationsDto.take,
        }),
        prisma.locations.count({ where: conditions }),
      ]);
      expect(result).toEqual({
        locations: mockFindManyPrismaResponse,
        totalCount: mockFindManyPrismaResponse.length,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single location', async () => {
      const id = 1;
      const mockFindUniquePrismaResponse = {
        id,
        name: 'Location 1',
        type: 'Planet',
      };

      prisma.locations.findUnique.mockResolvedValue(
        mockFindUniquePrismaResponse,
      );

      const result = await locationsRepository.findOne(id);

      expect(prisma.locations.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockFindUniquePrismaResponse);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if location does not exist', async () => {
      const id = 200;
      const updateLocationDto = {
        name: 'Updated Location',
      };

      prisma.locations.update.mockRejectedValue(new Error('Prisma error'));

      await expect(
        locationsRepository.update(id, updateLocationDto),
      ).rejects.toThrow(new NotFoundException('Location not found'));
    });

    it('should update an location if it exists', async () => {
      const id = 1;
      const updateLocationDto = {
        name: 'Updated Location',
      };
      const mockUpdatePrismaResponse = {
        id,
        type: 'Planet',
        ...updateLocationDto,
      };

      prisma.locations.update.mockResolvedValue(mockUpdatePrismaResponse);

      const result = await locationsRepository.update(id, updateLocationDto);

      expect(prisma.locations.update).toHaveBeenCalledWith({
        where: { id },
        data: updateLocationDto,
      });
      expect(result).toEqual(mockUpdatePrismaResponse);
    });
  });

  describe('delete', () => {
    it('should delete an location if it exists', async () => {
      const id = 1;
      const mockDeletePrismaResponse = {
        id,
        type: 'EP1',
        name: 'Location 1',
      };

      prisma.locations.delete.mockResolvedValue(mockDeletePrismaResponse);

      const result = await locationsRepository.delete(id);

      expect(prisma.locations.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockDeletePrismaResponse);
    });

    it('should not throw NotFoundException if location does not exist', async () => {
      const id = 200;
      prisma.locations.delete.mockRejectedValue(new Error('Prisma error'));

      await expect(locationsRepository.delete(id)).resolves.toBeUndefined();
    });
  });
});
