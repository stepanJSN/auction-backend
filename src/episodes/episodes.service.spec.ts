import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { EpisodesRepository } from './episodes.repository';
import { EpisodesService } from './episodes.service';
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('EpisodesService', () => {
  let episodesService: EpisodesService;
  let episodesRepository: DeepMockProxy<EpisodesRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [EpisodesService, EpisodesRepository],
    })
      .overrideProvider(EpisodesRepository)
      .useValue(mockDeep<EpisodesRepository>())
      .compile();

    episodesService = module.get(EpisodesService);
    episodesRepository = module.get(EpisodesRepository);
  });

  describe('create', () => {
    it('should throw ConflictException if episode with this name already exists', async () => {
      const createEpisodeDto = {
        name: 'Episode 0',
        code: 'EP0',
      };

      episodesRepository.findAll.mockResolvedValue({
        episodes: [
          {
            id: 1,
            ...createEpisodeDto,
          },
        ],
        totalCount: 1,
      });
      await expect(episodesService.create(createEpisodeDto)).rejects.toThrow(
        new ConflictException('Episode with this name already exists'),
      );

      expect(episodesRepository.findAll).toHaveBeenCalledWith({
        name: createEpisodeDto.name,
      });
    });
    it('should create a new episode', async () => {
      const createEpisodeDto = {
        name: 'Episode 1',
        code: 'EP1',
      };
      const mockCreatePrismaResponse = {
        id: 1,
        ...createEpisodeDto,
      };

      episodesRepository.findAll.mockResolvedValue({
        episodes: [],
        totalCount: 0,
      });
      episodesRepository.create.mockResolvedValue(mockCreatePrismaResponse);

      const result = await episodesService.create(createEpisodeDto);

      expect(episodesRepository.findAll).toHaveBeenCalledWith({
        name: createEpisodeDto.name,
      });
      expect(episodesRepository.create).toHaveBeenCalledWith(createEpisodeDto);
      expect(result).toEqual(mockCreatePrismaResponse);
    });
  });

  describe('findAll', () => {
    it('should find all episodes', async () => {
      const findAllEpisodesDto = {
        page: 1,
        take: 10,
        name: 'Episode',
      };
      const mockFindAllPrismaResponse = {
        episodes: [
          {
            id: 1,
            name: 'Episode 1',
            code: 'EP1',
          },
        ],
        totalCount: 1,
      };

      episodesRepository.findAll.mockResolvedValue({
        episodes: mockFindAllPrismaResponse.episodes,
        totalCount: mockFindAllPrismaResponse.totalCount,
      });

      const result = await episodesService.findAll(findAllEpisodesDto);

      expect(episodesRepository.findAll).toHaveBeenCalledWith(
        findAllEpisodesDto,
      );
      expect(result).toEqual({
        data: mockFindAllPrismaResponse.episodes,
        info: {
          page: findAllEpisodesDto.page,
          totalCount: mockFindAllPrismaResponse.totalCount,
          totalPages: Math.ceil(
            mockFindAllPrismaResponse.totalCount / findAllEpisodesDto.take,
          ),
        },
      });
    });
  });

  describe('findOne', () => {
    it('should find one episode if it exists', async () => {
      const id = 1;
      const mockFindOnePrismaResponse = {
        id: 1,
        name: 'Episode 1',
        code: 'EP1',
      };

      episodesRepository.findOne.mockResolvedValue(mockFindOnePrismaResponse);

      const result = await episodesService.findOne(id);

      expect(episodesRepository.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockFindOnePrismaResponse);
    });

    it('should throw NotFoundException if episode does not exist', async () => {
      const id = 200;
      episodesRepository.findOne.mockResolvedValue(null);

      await expect(episodesService.findOne(id)).rejects.toThrow(
        new NotFoundException('Episode not found'),
      );
    });
  });

  describe('update', () => {
    it('should update an episode if the updated name does not match another episode', async () => {
      const id = 1;
      const updateEpisodeDto = {
        name: 'Updated Episode',
        code: 'EP1',
      };
      const mockUpdatePrismaResponse = {
        id,
        ...updateEpisodeDto,
      };

      episodesRepository.findAll.mockResolvedValue({
        episodes: [
          {
            id: 1,
            ...updateEpisodeDto,
          },
        ],
        totalCount: 0,
      });
      episodesRepository.update.mockResolvedValue(mockUpdatePrismaResponse);

      const result = await episodesService.update(id, updateEpisodeDto);

      expect(episodesRepository.findAll).toHaveBeenCalledWith({
        name: updateEpisodeDto.name,
      });
      expect(episodesRepository.update).toHaveBeenCalledWith(
        id,
        updateEpisodeDto,
      );
      expect(result).toEqual(mockUpdatePrismaResponse);
    });

    it('should throw ConflictException if episode with this name already exists', async () => {
      const id = 1;
      const updateEpisodeDto = {
        name: 'Episode 2',
        code: 'EP1',
      };
      episodesRepository.findAll.mockResolvedValue({
        episodes: [
          {
            id: 2,
            ...updateEpisodeDto,
          },
        ],
        totalCount: 1,
      });
      await expect(
        episodesService.update(id, updateEpisodeDto),
      ).rejects.toThrow(
        new ConflictException('Episode with this name already exists'),
      );
      expect(episodesRepository.findAll).toHaveBeenCalledWith({
        name: updateEpisodeDto.name,
      });
    });
  });
});
