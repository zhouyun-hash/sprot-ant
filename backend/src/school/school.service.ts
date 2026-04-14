import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Grade } from '../grade/entities/grade.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { School } from './entities/school.entity';
import { Campus } from './entities/campus.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateCampusDto } from './dto/create-campus.dto';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Campus) private campusRepo: Repository<Campus>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
    @InjectRepository(Teacher) private teacherRepo: Repository<Teacher>,
  ) {}

  /** 教师账号仅返回本校，用于下拉选择等场景的数据隔离 */
  async findAll(
    query: { page?: number; size?: number; keyword?: string },
    actor?: { id: number; role: string },
  ) {
    const page = query.page || 1;
    const size = query.size || 20;
    if (actor?.role === 'teacher') {
      const t = await this.teacherRepo.findOne({ where: { userId: actor.id } });
      if (!t?.schoolId) {
        return { rows: [], total: 0, page, size };
      }
      const school = await this.schoolRepo.findOne({ where: { id: t.schoolId } });
      return { rows: school ? [school] : [], total: school ? 1 : 0, page, size };
    }
    const where: any = {};
    if (query.keyword) where.name = Like(`%${query.keyword}%`);
    const [rows, total] = await this.schoolRepo.findAndCount({
      where, skip: (page - 1) * size, take: size, order: { createdAt: 'DESC' },
    });
    return { rows, total, page, size };
  }

  async findOne(id: number) {
    const school = await this.schoolRepo.findOneBy({ id });
    if (!school) throw new NotFoundException('学校不存在');
    return school;
  }

  async create(dto: CreateSchoolDto) {
    return this.schoolRepo.save(this.schoolRepo.create(dto));
  }

  async update(id: number, dto: UpdateSchoolDto) {
    await this.findOne(id);
    await this.schoolRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    const gradeCount = await this.gradeRepo.count({ where: { schoolId: id } });
    if (gradeCount > 0) {
      throw new BadRequestException(
        `该校下仍有关联年级（${gradeCount} 条），请先删除或转移年级后再删除学校`,
      );
    }
    await this.schoolRepo.delete(id);
  }

  async findCampuses(schoolId: number) {
    return this.campusRepo.find({ where: { schoolId }, order: { createdAt: 'DESC' } });
  }

  async createCampus(dto: CreateCampusDto) {
    return this.campusRepo.save(this.campusRepo.create(dto));
  }

  async removeCampus(id: number) {
    await this.campusRepo.delete(id);
  }
}
