import { Injectable } from '@nestjs/common';
import { CardInstancesRepository } from './card-instances.repository';
import { FindAllCardInstancesType } from './types/find-all-card-instances.type';

@Injectable()
export class CardInstancesService {
  constructor(private cardInstancesRepository: CardInstancesRepository) {}

  findAll(findAllCardInstances: FindAllCardInstancesType) {
    return this.cardInstancesRepository.findAll(findAllCardInstances);
  }
}
