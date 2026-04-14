import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeworkCorrection } from './entities/homework-correction.entity';
import { CreateHomeworkCorrectionDto } from './dto/create-homework-correction.dto';
import { UpdateHomeworkCorrectionDto } from './dto/update-homework-correction.dto';

@Injectable()
export class HomeworkReviewService {
  constructor(
    @InjectRepository(HomeworkCorrection)
    private readonly correctionRepo: Repository<HomeworkCorrection>,
  ) {}

  async findAll(query: {
    page?: number;
    size?: number;
    status?: string;
    submissionId?: number;
  }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.submissionId) where.submissionId = query.submissionId;
    const [rows, total] = await this.correctionRepo.findAndCount({
      where,
      skip: (page - 1) * size,
      take: size,
      order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const row = await this.correctionRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('批改记录不存在');
    return row;
  }

  async create(dto: CreateHomeworkCorrectionDto) {
    return this.correctionRepo.save(this.correctionRepo.create(dto));
  }

  async update(id: number, dto: UpdateHomeworkCorrectionDto) {
    await this.findOne(id);
    await this.correctionRepo.update(id, dto as any);
    return this.findOne(id);
  }
}
