import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('ImagesService', () => {
  let imagesService: ImagesService;
  const serverUrl = 'http://localhost:3000';
  const imageFolder = 'public';
  const expectedDirPath = join(__dirname, '../../..', imageFolder);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'server_url':
                  return serverUrl;
                case 'image_folder':
                  return imageFolder;
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    imagesService = module.get<ImagesService>(ImagesService);
  });

  describe('upload', () => {
    const filename = 'test-image.jpg';
    it('should upload an image and return its URL', async () => {
      const content = {
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      jest.spyOn(fs, 'mkdir');
      jest.spyOn(fs, 'writeFile');

      const result = await imagesService.upload(filename, content);

      const expectedFilePath = join(expectedDirPath, filename);
      expect(fs.mkdir).toHaveBeenCalledWith(expectedDirPath, {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expectedFilePath,
        content.buffer,
      );
      expect(result).toBe(`${serverUrl}/${filename}`);
    });

    it('should throw an error if saving the image fails', async () => {
      const content = {
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      jest.spyOn(fs, 'mkdir').mockRejectedValue(new Error('mkdir failed'));
      await expect(imagesService.upload(filename, content)).rejects.toThrow(
        'Failed to save image',
      );
    });
  });

  describe('delete', () => {
    const filename = 'test-image.jpg';
    const filenameUrl = `${serverUrl}/${filename}`;
    it('should delete an image by its filename', async () => {
      jest.spyOn(fs, 'unlink');

      await imagesService.delete(filenameUrl);

      const expectedPath = join(expectedDirPath, filename);
      expect(fs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should throw an error if deleting the image fails', async () => {
      jest.spyOn(fs, 'unlink').mockRejectedValue(new Error('unlink failed'));
      await expect(imagesService.delete(filenameUrl)).rejects.toThrow(
        'Failed to delete image',
      );
    });
  });
});
