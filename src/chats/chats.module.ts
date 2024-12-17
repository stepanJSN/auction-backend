import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { ChatsRepository } from './chats.repository';

@Module({
  providers: [ChatsGateway, ChatsService, ChatsRepository],
})
export class ChatsModule {}
