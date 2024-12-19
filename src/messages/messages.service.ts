import { Injectable } from '@nestjs/common';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesRepository } from './messages.repository';
import { CreateMessageType } from './types/create-message.type';
import { FindAllMessagesOfChatDto } from './dto/find-all-messages-of-chat.dto';

@Injectable()
export class MessagesService {
  constructor(private messagesRepository: MessagesRepository) {}
  create(createMessage: CreateMessageType) {
    return this.messagesRepository.create(createMessage);
  }

  async findAll(findOneChatDto: FindAllMessagesOfChatDto) {
    const messages = await this.messagesRepository.findAll(findOneChatDto);

    const hasNextPage = messages.length > findOneChatDto.take;
    if (hasNextPage) messages.pop();

    return {
      data: messages,
      pagination: {
        cursor: messages.length > 0 ? messages[messages.length - 1].id : null,
        hasNextPage,
      },
    };
  }

  update(updateMessageDto: UpdateMessageDto) {
    return this.messagesRepository.update(updateMessageDto);
  }

  remove(id: string) {
    return this.messagesRepository.remove(id);
  }
}
