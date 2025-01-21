import { Injectable } from '@nestjs/common';
import { SystemRepository } from './system.repository';

@Injectable()
export class SystemService {
  constructor(private systemRepository: SystemRepository) {}

  async findExchangeRate() {
    const exchangeRateRecord =
      await this.systemRepository.findOne('exchange_rate');
    return {
      exchange_rate: +exchangeRateRecord.value,
      updated_at: exchangeRateRecord.updated_at,
    };
  }

  async updateExchangeRate(newValue: number) {
    const exchangeRateRecord = await this.systemRepository.update(
      'exchange_rate',
      newValue.toString(),
    );
    return {
      exchange_rate: +exchangeRateRecord.value,
      updated_at: exchangeRateRecord.updated_at,
    };
  }
}
