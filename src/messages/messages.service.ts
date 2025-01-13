import { Injectable } from '@nestjs/common';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesRepository } from './messages.repository';
import { CreateMessageType } from './types/create-message.type';
import { FindAllMessagesOfChatDto } from './dto/find-all-messages-of-chat.dto';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private messagesRepository: MessagesRepository,
    private messagesGateway: MessagesGateway,
  ) {}
  async create(createMessage: CreateMessageType) {
    const message = await this.messagesRepository.create(createMessage);
    this.messagesGateway.newMessage(message.chat_id, message);
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

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    const message = await this.messagesRepository.update(id, updateMessageDto);
    this.messagesGateway.editMessage(message.chat_id, message);
    return message;
  }

  async remove(id: string) {
    const message = await this.messagesRepository.remove(id);
    this.messagesGateway.remove(message.chat_id, id);
  }
}
