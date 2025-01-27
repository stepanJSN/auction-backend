import { Injectable } from '@nestjs/common';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesRepository } from './messages.repository';
import { CreateMessageType } from './types/create-message.type';
import { MessagesGateway } from './messages.gateway';
import { FindAllMessagesType } from './types/find-all-messages.type';

@Injectable()
export class MessagesService {
  constructor(
    private messagesRepository: MessagesRepository,
    private messagesGateway: MessagesGateway,
  ) {}
  async create(createMessage: CreateMessageType) {
    const message = await this.messagesRepository.create(createMessage);
    this.messagesGateway.newMessage(message.chat_id, message);
    return {
      id: message.id,
      message: message.message,
      created_at: message.created_at,
      sender: {
        name: message.sender.name,
        surname: message.sender.surname,
        is_this_user_message: true,
      },
    };
  }

  async findAll(findOneChatDto: FindAllMessagesType) {
    const messages = await this.messagesRepository.findAll(findOneChatDto);
    
    const hasNextPage = messages.length > findOneChatDto.take;
    if (hasNextPage) messages.pop();

    const mappedMessages = messages.map((message) => ({
      id: message.id,
      message: message.message,
      created_at: message.created_at,
      sender: {
        name: message.sender.name,
        surname: message.sender.surname,
        is_this_user_message: message.sender.id === findOneChatDto.userId,
      },
    }));
    return {
      data: mappedMessages.reverse(),
      pagination: {
        cursor: messages.length > 0 ? messages[messages.length - 1].id : null,
        hasNextPage,
      },
    };
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    const message = await this.messagesRepository.update(id, updateMessageDto);
    this.messagesGateway.editMessage(message.chat_id, message);
    return {
      id: message.id,
      message: message.message,
      created_at: message.created_at,
      sender: {
        name: message.sender.name,
        surname: message.sender.surname,
        is_this_user_message: true,
      },
    };
  }

  async remove(id: string) {
    const message = await this.messagesRepository.remove(id);
    this.messagesGateway.remove(message.chat_id, id);
  }
}
