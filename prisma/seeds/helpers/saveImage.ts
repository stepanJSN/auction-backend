import { promises as fs, mkdirSync } from 'fs';
import { join } from 'path';

const UPLOAD_FOLDER = './dist/' + process.env.IMAGE_FOLDER;
const SERVER_URL = process.env.SERVER_URL;

export async function saveImage(imageURL: string) {
  mkdirSync(UPLOAD_FOLDER, { recursive: true });

  const fileName = 'avatar' + imageURL.split('/').pop();
  try {
    const response = await fetch(imageURL);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(join(UPLOAD_FOLDER, fileName), buffer);

    return `${SERVER_URL}/${fileName}`;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to save image');
  }
}
