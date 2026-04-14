import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AiConfig } from './entities/ai-config.entity';
import { AiModel } from './entities/ai-model.entity';
import { CreateAiConfigDto } from './dto/create-ai-config.dto';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';
import { CreateAiModelDto } from './dto/create-ai-model.dto';

@Injectable()
export class AiConfigService {
  constructor(
    @InjectRepository(AiConfig) private configRepo: Repository<AiConfig>,
    @InjectRepository(AiModel) private modelRepo: Repository<AiModel>,
  ) {}

  /* ---- AI Config CRUD ---- */

  async findAll(query: { page?: number; size?: number; keyword?: string; category?: string; status?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    const [rows, total] = await this.configRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const config = await this.configRepo.findOneBy({ id });
    if (!config) throw new NotFoundException('AI 配置不存在');
    return config;
  }

  async create(dto: CreateAiConfigDto) {
    return this.configRepo.save(this.configRepo.create(dto));
  }

  async update(id: number, dto: UpdateAiConfigDto) {
    await this.findOne(id);
    await this.configRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.configRepo.delete(id);
  }

  /* ---- AI Model ---- */

  async findAllModels(query: { page?: number; size?: number }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const [rows, total] = await this.modelRepo.findAndCount({
      skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async createModel(dto: CreateAiModelDto) {
    return this.modelRepo.save(this.modelRepo.create(dto));
  }

  async removeModel(id: number) {
    const model = await this.modelRepo.findOneBy({ id });
    if (!model) throw new NotFoundException('AI 模型不存在');
    await this.modelRepo.delete(id);
  }
}
