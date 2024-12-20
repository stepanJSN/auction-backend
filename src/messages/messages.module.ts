import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesRepository } from './messages.repository';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/guards/auth.guard';
import { MessagesController } from './messages.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt_key'),
      }),
    }),
  ],
  providers: [MessagesService, MessagesGateway, MessagesRepository, AuthGuard],
  controllers: [MessagesController],
})
export class MessagesModule {}
