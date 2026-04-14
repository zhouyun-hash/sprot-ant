import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamBatch } from './entities/exam-batch.entity';
import { CreateExamBatchDto } from './dto/create-exam-batch.dto';
import { UpdateExamBatchDto } from './dto/update-exam-batch.dto';

@Injectable()
export class ExamBatchService {
  constructor(@InjectRepository(ExamBatch) private repo: Repository<ExamBatch>) {}

  async findAll(query: { page?: number; size?: number; planId?: number; status?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.planId) where.planId = query.planId;
    if (query.status) where.status = query.status;
    const [rows, total] = await this.repo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('体测批次不存在');
    return item;
  }

  async create(dto: CreateExamBatchDto) { return this.repo.save(this.repo.create(dto)); }
  async update(id: number, dto: UpdateExamBatchDto) { await this.findOne(id); await this.repo.update(id, dto); return this.findOne(id); }
  async remove(id: number) { await this.findOne(id); await this.repo.delete(id); }
}
