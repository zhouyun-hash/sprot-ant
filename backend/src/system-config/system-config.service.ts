import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { CreateSystemConfigDto } from './dto/create-system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig) private configRepo: Repository<SystemConfig>,
  ) {}

  async findAll(category?: string) {
    const where: any = {};
    if (category) where.category = category;
    return this.configRepo.find({ where, order: { configKey: 'ASC' } });
  }

  async getValue(key: string) {
    const row = await this.configRepo.findOneBy({ configKey: key });
    if (!row) throw new NotFoundException(`配置项 ${key} 不存在`);
    return row;
  }

  async setValue(key: string, value: string) {
    let row = await this.configRepo.findOneBy({ configKey: key });
    if (row) {
      row.configValue = value;
      return this.configRepo.save(row);
    }
    return this.configRepo.save(this.configRepo.create({ configKey: key, configValue: value }));
  }

  async create(dto: CreateSystemConfigDto) {
    return this.configRepo.save(this.configRepo.create(dto));
  }

  async remove(id: number) {
    const row = await this.configRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('配置项不存在');
    await this.configRepo.delete(id);
  }
}
