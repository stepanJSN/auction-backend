import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ImagesService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('server_url');
    const imageFolder = this.configService.get<string>('image_folder');

    this.uploadDir = join(__dirname, '..', '..', imageFolder);
  }

  async upload(filename: string, content: Express.Multer.File) {
    const filePath = join(this.uploadDir, filename);
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.writeFile(filePath, content.buffer);
      return `${this.baseUrl}/${filename}`;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to save image');
    }
  }

  async delete(filename: string) {
    const filePath = join(this.uploadDir, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(error);
      throw new Error('Failed to delete image');
    }
  }
}
