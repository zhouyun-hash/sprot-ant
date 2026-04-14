import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BackupRecord } from './entities/backup-record.entity';
import { CreateBackupDto } from './dto/create-backup.dto';

@Injectable()
export class BackupService {
  constructor(
    @InjectRepository(BackupRecord) private backupRepo: Repository<BackupRecord>,
  ) {}

  async findAll(query: { page?: number; size?: number }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const [rows, total] = await this.backupRepo.findAndCount({
      skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async create(dto: CreateBackupDto) {
    const record = this.backupRepo.create({
      ...dto,
      type: dto.type || 'full',
      status: 'completed',
      fileUrl: `/backups/backup_${Date.now()}.sql`,
      fileSize: Math.floor(Math.random() * 1024 * 1024 * 100),
    });
    return this.backupRepo.save(record);
  }

  async remove(id: number) {
    const row = await this.backupRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('备份记录不存在');
    await this.backupRepo.delete(id);
  }
}
