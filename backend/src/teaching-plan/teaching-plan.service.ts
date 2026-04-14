import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { TeachingPlan } from './entities/teaching-plan.entity';
import { CreateTeachingPlanDto } from './dto/create-teaching-plan.dto';
import { UpdateTeachingPlanDto } from './dto/update-teaching-plan.dto';

@Injectable()
export class TeachingPlanService {
  constructor(
    @InjectRepository(TeachingPlan)
    private readonly planRepo: Repository<TeachingPlan>,
  ) {}

  async findAll(query: {
    page?: number;
    size?: number;
    keyword?: string;
    teacherId?: number;
    status?: string;
  }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.keyword) where.title = Like(`%${query.keyword}%`);
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.status) where.status = query.status;
    const [rows, total] = await this.planRepo.findAndCount({
      where,
      skip: (page - 1) * size,
      take: size,
      order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const row = await this.planRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('教学计划不存在');
    return row;
  }

  async create(dto: CreateTeachingPlanDto) {
    return this.planRepo.save(this.planRepo.create(dto));
  }

  async update(id: number, dto: UpdateTeachingPlanDto) {
    await this.findOne(id);
    await this.planRepo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.planRepo.delete(id);
  }
}
