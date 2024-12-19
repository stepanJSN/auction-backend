import { Injectable } from '@nestjs/common';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesRepository } from './messages.repository';
import { CreateMessageType } from './types/create-message.type';

@Injectable()
export class MessagesService {
  constructor(private messagesRepository: MessagesRepository) {}
  create(createMessage: CreateMessageType) {
    return this.messagesRepository.create(createMessage);
  }

  update(id: string, updateMessageDto: UpdateMessageDto) {
    return this.messagesRepository.update(id, updateMessageDto);
  }

  remove(id: string) {
    return this.messagesRepository.remove(id);
  }
}
