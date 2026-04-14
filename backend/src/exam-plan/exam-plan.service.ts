import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ExamPlan } from './entities/exam-plan.entity';
import { CreateExamPlanDto } from './dto/create-exam-plan.dto';
import { UpdateExamPlanDto } from './dto/update-exam-plan.dto';

@Injectable()
export class ExamPlanService {
  constructor(@InjectRepository(ExamPlan) private repo: Repository<ExamPlan>) {}

  async findAll(query: { page?: number; size?: number; keyword?: string; status?: string; schoolYear?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    if (query.status) where.status = query.status;
    if (query.schoolYear) where.schoolYear = query.schoolYear;
    const [rows, total] = await this.repo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('体测计划不存在');
    return item;
  }

  async create(dto: CreateExamPlanDto) { return this.repo.save(this.repo.create(dto)); }
  async update(id: number, dto: UpdateExamPlanDto) { await this.findOne(id); await this.repo.update(id, dto); return this.findOne(id); }
  async remove(id: number) { await this.findOne(id); await this.repo.delete(id); }
}
