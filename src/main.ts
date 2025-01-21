import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  const clientUrl = configService.get<string>('client_url');
  const imageFolder = configService.get<string>('image_folder');

  app.useStaticAssets(join(__dirname, '../..', imageFolder));
  app.enableCors({
    origin: [clientUrl],
    credentials: true,
    exposedHeaders: 'set-cookie',
  });
  await app.listen(port);
}
bootstrap();
