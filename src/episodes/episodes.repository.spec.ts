import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { EpisodesRepository } from './episodes.repository';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

describe('EpisodesRepository', () => {
  let episodesRepository: EpisodesRepository;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [EpisodesRepository, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    episodesRepository = module.get(EpisodesRepository);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a new episode', async () => {
      const createEpisodeDto = {
        name: 'Episode 1',
        code: 'EP1',
      };
      const mockCreatePrismaResponse = {
        id: 1,
        ...createEpisodeDto,
      };

      prisma.episodes.create.mockResolvedValue(mockCreatePrismaResponse);

      const result = await episodesRepository.create(createEpisodeDto);

      expect(prisma.episodes.create).toHaveBeenCalledWith({
        data: createEpisodeDto,
      });
      expect(result).toEqual(mockCreatePrismaResponse);
    });
  });

  describe('findAll', () => {
    it('should return a list of episodes', async () => {
      const findAllEpisodesDto = {
        name: 'Episode',
        page: 1,
        take: 10,
      };
      const mockFindManyPrismaResponse = [
        {
          id: 1,
          name: 'Episode 1',
          code: 'EP1',
        },
        {
          id: 2,
          name: 'Episode 2',
          code: 'EP2',
        },
      ];
      const conditions = {
        name: {
          contains: findAllEpisodesDto.name,
        },
      };

      prisma.$transaction.mockResolvedValue([
        mockFindManyPrismaResponse,
        mockFindManyPrismaResponse.length,
      ]);

      const result = await episodesRepository.findAll(findAllEpisodesDto);

      expect(prisma.$transaction).toHaveBeenCalledWith([
        prisma.episodes.findMany({
          where: conditions,
          skip: (findAllEpisodesDto.page - 1) * findAllEpisodesDto.take,
          take: findAllEpisodesDto.take,
        }),
        prisma.episodes.count({ where: conditions }),
      ]);
      expect(result).toEqual({
        episodes: mockFindManyPrismaResponse,
        totalCount: mockFindManyPrismaResponse.length,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single episode', async () => {
      const id = 1;
      const mockFindUniquePrismaResponse = {
        id,
        name: 'Episode 1',
        code: 'EP1',
      };

      prisma.episodes.findUnique.mockResolvedValue(
        mockFindUniquePrismaResponse,
      );

      const result = await episodesRepository.findOne(id);

      expect(prisma.episodes.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockFindUniquePrismaResponse);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if episode does not exist', async () => {
      const id = 200;
      const updateEpisodeDto = {
        name: 'Updated Episode',
      };

      prisma.episodes.update.mockRejectedValue(new Error('Prisma error'));

      await expect(
        episodesRepository.update(id, updateEpisodeDto),
      ).rejects.toThrow(new NotFoundException('Episode not found'));
    });

    it('should update an episode if it exists', async () => {
      const id = 1;
      const updateEpisodeDto = {
        name: 'Updated Episode',
      };
      const mockUpdatePrismaResponse = {
        id,
        code: 'EP1',
        ...updateEpisodeDto,
      };

      prisma.episodes.update.mockResolvedValue(mockUpdatePrismaResponse);

      const result = await episodesRepository.update(id, updateEpisodeDto);

      expect(prisma.episodes.update).toHaveBeenCalledWith({
        where: { id },
        data: updateEpisodeDto,
      });
      expect(result).toEqual(mockUpdatePrismaResponse);
    });
  });

  describe('delete', () => {
    it('should delete an episode if it exists', async () => {
      const id = 1;
      const mockDeletePrismaResponse = {
        id,
        code: 'EP1',
        name: 'Episode 1',
      };

      prisma.episodes.delete.mockResolvedValue(mockDeletePrismaResponse);

      const result = await episodesRepository.delete(id);

      expect(prisma.episodes.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockDeletePrismaResponse);
    });

    it('should not throw NotFoundException if episode does not exist', async () => {
      const id = 200;
      prisma.episodes.delete.mockRejectedValue(new Error('Prisma error'));

      await expect(episodesRepository.delete(id)).resolves.toBeUndefined();
    });
  });
});
