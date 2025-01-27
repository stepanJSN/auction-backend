import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';
import { Test } from '@nestjs/testing';

describe('EpisodesController', () => {
  let episodesController: EpisodesController;
  let episodesService: DeepMockProxy<EpisodesService>;
  const mockEpisodeResponse = {
    id: 1,
    name: 'Test Episode',
    code: 'EP1',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [EpisodesController],
      providers: [
        { provide: EpisodesService, useValue: mockDeep<EpisodesService>() },
      ],
    }).compile();

    episodesController = module.get(EpisodesController);
    episodesService = module.get(EpisodesService);
  });

  describe('create', () => {
    it('should create an episode', async () => {
      const createEpisodeDto = {
        name: mockEpisodeResponse.name,
        code: mockEpisodeResponse.code,
      };
      episodesService.create.mockResolvedValue(mockEpisodeResponse);
      const response = await episodesController.create(createEpisodeDto);
      expect(episodesService.create).toHaveBeenCalledWith(createEpisodeDto);
      expect(response).toEqual(mockEpisodeResponse);
    });
  });

  describe('findAll', () => {
    it('should find all episodes', async () => {
      const findAllEpisodesDto = {
        name: 'Episode',
        page: 1,
        limit: 10,
      };
      const mockFindAllPrismaResponse = {
        data: [mockEpisodeResponse],
        info: {
          page: 1,
          totalCount: 1,
          totalPages: 1,
        },
      };

      episodesService.findAll.mockResolvedValue(mockFindAllPrismaResponse);

      const result = await episodesController.findAll(findAllEpisodesDto);
      expect(episodesService.findAll).toHaveBeenCalledWith(findAllEpisodesDto);
      expect(result).toEqual(mockFindAllPrismaResponse);
    });
  });

  describe('findOne', () => {
    it('should find one episode', async () => {
      const id = 1;
      episodesService.findOne.mockResolvedValue(mockEpisodeResponse);
      const response = await episodesController.findOne(id);
      expect(episodesService.findOne).toHaveBeenCalledWith(id);
      expect(response).toEqual(mockEpisodeResponse);
    });
  });

  describe('update', () => {
    it('should update an episode', async () => {
      const id = 1;
      const updateEpisodeDto = {
        name: 'Updated Episode',
        code: mockEpisodeResponse.code,
      };
      episodesService.update.mockResolvedValue({
        ...mockEpisodeResponse,
        name: updateEpisodeDto.name,
      });
      const response = await episodesController.update(id, updateEpisodeDto);
      expect(episodesService.update).toHaveBeenCalledWith(id, updateEpisodeDto);
      expect(response).toEqual({
        ...mockEpisodeResponse,
        name: updateEpisodeDto.name,
      });
    });
  });

  describe('remove', () => {
    it('should delete an episode', async () => {
      const id = 1;
      episodesService.remove.mockResolvedValue(mockEpisodeResponse);
      const result = await episodesController.remove(id);
      expect(episodesService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockEpisodeResponse);
    });
  });
});
