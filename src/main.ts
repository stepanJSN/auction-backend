import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  const clientUrl = configService.get<string>('client_url');

  app.enableCors({
    origin: [clientUrl],
    credentials: true,
    exposedHeaders: 'set-cookie',
  });
  await app.listen(port);
}
bootstrap();
