import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { ChatsRepository } from './chats.repository';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/guards/auth.guard';
import { ChatsController } from './chats.controller';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt_key'),
      }),
    }),
    MessagesModule,
  ],
  providers: [ChatsGateway, ChatsService, ChatsRepository, AuthGuard],
  controllers: [ChatsController],
})
export class ChatsModule {}
