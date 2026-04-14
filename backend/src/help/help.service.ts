import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HelpArticle } from './entities/help-article.entity';
import { CreateHelpArticleDto } from './dto/create-help-article.dto';
import { UpdateHelpArticleDto } from './dto/update-help-article.dto';

@Injectable()
export class HelpService {
  constructor(
    @InjectRepository(HelpArticle) private articleRepo: Repository<HelpArticle>,
  ) {}

  async findAll(query: { page?: number; size?: number; category?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.category) where.category = query.category;
    const [rows, total] = await this.articleRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const row = await this.articleRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('帮助文章不存在');
    return row;
  }

  async create(dto: CreateHelpArticleDto) {
    return this.articleRepo.save(this.articleRepo.create(dto));
  }

  async update(id: number, dto: UpdateHelpArticleDto) {
    await this.findOne(id);
    await this.articleRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.articleRepo.delete(id);
  }
}
