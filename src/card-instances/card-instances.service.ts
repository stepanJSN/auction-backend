import { Injectable } from '@nestjs/common';
import { CardInstancesRepository } from './card-instances.repository';
import { FindAllCardInstancesType } from './types/find-all-card-instances.type';
import { CreateCardInstanceType } from './types/create-card-instance.type';

@Injectable()
export class CardInstancesService {
  constructor(private cardInstancesRepository: CardInstancesRepository) {}

  create(cardInstanceData: CreateCardInstanceType) {
    return this.cardInstancesRepository.create(cardInstanceData);
  }

  findAll(findAllCardInstances: FindAllCardInstancesType) {
    return this.cardInstancesRepository.findAll(findAllCardInstances);
  }
}
