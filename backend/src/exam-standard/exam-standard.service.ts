import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamStandard } from './entities/exam-standard.entity';
import { CreateExamStandardDto } from './dto/create-exam-standard.dto';
import { UpdateExamStandardDto } from './dto/update-exam-standard.dto';

@Injectable()
export class ExamStandardService {
  constructor(@InjectRepository(ExamStandard) private repo: Repository<ExamStandard>) {}

  async findAll(query: { page?: number; size?: number; projectId?: number; gender?: string; version?: string }) {
    const page = query.page || 1;
    const size = query.size || 50;
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.gender) where.gender = query.gender;
    if (query.version) where.version = query.version;
    const [rows, total] = await this.repo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('体测标准不存在');
    return item;
  }

  async create(dto: CreateExamStandardDto) { return this.repo.save(this.repo.create(dto)); }

  async update(id: number, dto: UpdateExamStandardDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) { await this.findOne(id); await this.repo.delete(id); }
}
