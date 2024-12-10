import { existsSync, promises as fs, mkdirSync } from 'fs';
import { join } from 'path';

const UPLOAD_FOLDER = './public';
const SERVER_URL = 'http://localhost:3000/';

export async function saveImage(imageURL: string) {
  if (!existsSync(UPLOAD_FOLDER)) {
    mkdirSync(UPLOAD_FOLDER);
  }

  const fileName = 'avatar' + imageURL.split('/').pop();
  try {
    const response = await fetch(imageURL);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(join(UPLOAD_FOLDER, fileName), buffer);

    return SERVER_URL + fileName;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to save image');
  }
}
