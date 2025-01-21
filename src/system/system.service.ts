import { Injectable } from '@nestjs/common';
import { SystemRepository } from './system.repository';

@Injectable()
export class SystemService {
  constructor(private systemRepository: SystemRepository) {}

  findExchangeRate() {
    return this.systemRepository.findOne('exchange_rate');
  }

  updateExchangeRate(newValue: number) {
    return this.systemRepository.update('exchange_rate', newValue.toString());
  }
}
