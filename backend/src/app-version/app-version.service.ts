import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppVersion } from './entities/app-version.entity';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { UpdateAppVersionDto } from './dto/update-app-version.dto';

@Injectable()
export class AppVersionService {
  constructor(
    @InjectRepository(AppVersion) private versionRepo: Repository<AppVersion>,
  ) {}

  async findAll() {
    return this.versionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const row = await this.versionRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('版本不存在');
    return row;
  }

  async create(dto: CreateAppVersionDto) {
    return this.versionRepo.save(this.versionRepo.create(dto));
  }

  async update(id: number, dto: UpdateAppVersionDto) {
    await this.findOne(id);
    await this.versionRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.versionRepo.delete(id);
  }
}
