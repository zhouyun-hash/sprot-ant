import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoreReview } from './entities/score-review.entity';

@Injectable()
export class ScoreReviewService {
  constructor(@InjectRepository(ScoreReview) private repo: Repository<ScoreReview>) {}

  async findAll(query: { page?: number; size?: number; status?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.status) where.status = query.status;
    const [rows, total] = await this.repo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('审核记录不存在');
    return item;
  }

  async approve(id: number, reviewerId: number, comment?: string) {
    const item = await this.findOne(id);
    item.status = 'approved';
    item.reviewerId = reviewerId;
    if (comment) item.comment = comment;
    return this.repo.save(item);
  }

  async reject(id: number, reviewerId: number, comment: string) {
    const item = await this.findOne(id);
    item.status = 'rejected';
    item.reviewerId = reviewerId;
    item.comment = comment;
    return this.repo.save(item);
  }

  async create(data: Partial<ScoreReview>) {
    return this.repo.save(this.repo.create(data));
  }
}
