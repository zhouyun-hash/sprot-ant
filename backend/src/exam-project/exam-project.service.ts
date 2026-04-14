import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ExamProject } from './entities/exam-project.entity';
import { CreateExamProjectDto } from './dto/create-exam-project.dto';
import { UpdateExamProjectDto } from './dto/update-exam-project.dto';
import { normalizeExamProjectScoreType } from './constants/exam-project-score-type';

@Injectable()
export class ExamProjectService {
  constructor(@InjectRepository(ExamProject) private repo: Repository<ExamProject>) {}

  async findAll(query: { page?: number; size?: number; keyword?: string; category?: string }) {
    const page = query.page || 1;
    const size = query.size || 50;
    const where: any = {};
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    if (query.category) where.category = query.category;
    const [rows, total] = await this.repo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('体测项目不存在');
    return item;
  }

  async create(dto: CreateExamProjectDto) {
    const payload = this.repo.create({
      ...dto,
      scoreType: normalizeExamProjectScoreType(dto.scoreType as unknown as string),
      sortOrder: Number.isFinite(dto.sortOrder) ? Number(dto.sortOrder) : 0,
      enabled: dto.enabled === false ? 0 : 1,
    } as Partial<ExamProject>);
    return this.repo.save(payload);
  }

  async update(id: number, dto: UpdateExamProjectDto) {
    await this.findOne(id);
    const patch: Record<string, unknown> = { ...dto };
    if (dto.scoreType !== undefined) {
      patch.scoreType = normalizeExamProjectScoreType(
        dto.scoreType as unknown as string,
      );
    }
    await this.repo.update(id, patch as Partial<ExamProject>);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  async toggleEnabled(id: number) {
    const item = await this.findOne(id);
    item.enabled = item.enabled ? 0 : 1;
    return this.repo.save(item);
  }
}
