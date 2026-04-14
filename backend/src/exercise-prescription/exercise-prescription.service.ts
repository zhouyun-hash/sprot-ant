import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExercisePrescription } from './entities/exercise-prescription.entity';
import { CreateExercisePrescriptionDto } from './dto/create-exercise-prescription.dto';
import { UpdateExercisePrescriptionDto } from './dto/update-exercise-prescription.dto';

@Injectable()
export class ExercisePrescriptionService {
  constructor(@InjectRepository(ExercisePrescription) private repo: Repository<ExercisePrescription>) {}

  async findAll(query: { page?: number; size?: number; studentId?: number; category?: string; status?: string }) {
    const page = query.page || 1;
    const size = query.size || 20;
    const where: any = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    const [rows, total] = await this.repo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('运动处方不存在');
    return item;
  }

  async create(dto: CreateExercisePrescriptionDto) { return this.repo.save(this.repo.create(dto)); }
  async update(id: number, dto: UpdateExercisePrescriptionDto) { await this.findOne(id); await this.repo.update(id, dto); return this.findOne(id); }
  async remove(id: number) { await this.findOne(id); await this.repo.delete(id); }
}
