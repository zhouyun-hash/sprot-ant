import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(@InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>) {}

  async findAll(query: { page?: number; size?: number; username?: string; action?: string; startDate?: string; endDate?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.username) where.username = Like(`%${query.username}%`);
    if (query.action) where.action = query.action;
    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }
    const [rows, total] = await this.auditLogRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }
}
