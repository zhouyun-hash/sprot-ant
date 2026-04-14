import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { TeachingResource } from './entities/teaching-resource.entity';
import { CreateTeachingResourceDto } from './dto/create-teaching-resource.dto';
import { UpdateTeachingResourceDto } from './dto/update-teaching-resource.dto';

@Injectable()
export class ResourceLibraryService {
  constructor(
    @InjectRepository(TeachingResource)
    private readonly resourceRepo: Repository<TeachingResource>,
  ) {}

  async findAll(query: {
    page?: number;
    size?: number;
    keyword?: string;
    type?: string;
    category?: string;
  }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.keyword) where.title = Like(`%${query.keyword}%`);
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    const [rows, total] = await this.resourceRepo.findAndCount({
      where,
      skip: (page - 1) * size,
      take: size,
      order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const row = await this.resourceRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('教学资源不存在');
    return row;
  }

  async create(dto: CreateTeachingResourceDto) {
    return this.resourceRepo.save(this.resourceRepo.create(dto));
  }

  async update(id: number, dto: UpdateTeachingResourceDto) {
    await this.findOne(id);
    await this.resourceRepo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.resourceRepo.delete(id);
  }
}
