/**
 * 年级与学校绑定后，业务上可按「学校 + 年级」维度做数据隔离与汇总；
 * 课表、成绩等模块在查询/统计时宜携带学校与年级条件（与班级、教师归属一致）。
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { canManageAllSchools } from '../common/school-scope.util';
import { School } from '../school/entities/school.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { Grade } from './entities/grade.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';

type RequestActor = { id: number; role: string };

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(Teacher) private teacherRepo: Repository<Teacher>,
  ) {}

  async resolveSchoolScope(actor: RequestActor): Promise<number | null> {
    if (canManageAllSchools(actor.role)) {
      return null;
    }
    if (actor.role === 'teacher') {
      const t = await this.teacherRepo.findOne({ where: { userId: actor.id } });
      if (!t?.schoolId) {
        throw new ForbiddenException('教师未绑定学校，无法操作年级数据');
      }
      return Number(t.schoolId);
    }
    throw new ForbiddenException('无权限操作年级数据');
  }

  /**
   * 列表：集团管理员可看全部；教师仅本校；可选 schoolId 仅管理员用于筛选。
   */
  async findAll(
    query: {
      page?: number;
      size?: number;
      keyword?: string;
      schoolYear?: string;
      schoolId?: number;
    },
    actor?: RequestActor,
  ) {
    const page = query.page || 1;
    const size = query.size || 50;
    const qb = this.gradeRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.school', 'sch')
      .orderBy('g.sortOrder', 'ASC')
      .addOrderBy('g.createdAt', 'DESC');

    if (query.keyword) {
      qb.andWhere('g.name LIKE :kw', { kw: `%${query.keyword}%` });
    }
    if (query.schoolYear) {
      qb.andWhere('g.schoolYear = :sy', { sy: query.schoolYear });
    }

    if (actor) {
      const scope = await this.resolveSchoolScope(actor);
      if (scope !== null) {
        qb.andWhere('g.schoolId = :sid', { sid: scope });
      } else if (query.schoolId != null && query.schoolId > 0) {
        qb.andWhere('g.schoolId = :fsid', { fsid: query.schoolId });
      }
    } else if (query.schoolId != null && query.schoolId > 0) {
      qb.andWhere('g.schoolId = :fsid', { fsid: query.schoolId });
    }

    const [rows, total] = await qb
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    return { rows, total, page, size };
  }

  async findOne(id: number, actor?: RequestActor) {
    const grade = await this.gradeRepo.findOne({
      where: { id },
      relations: ['school'],
    });
    if (!grade) throw new NotFoundException('年级不存在');
    if (actor) {
      const scope = await this.resolveSchoolScope(actor);
      if (scope !== null && Number(grade.schoolId) !== scope) {
        throw new ForbiddenException('无权查看该年级');
      }
    }
    return grade;
  }

  async create(dto: CreateGradeDto, actor: RequestActor) {
    const school = await this.schoolRepo.findOne({ where: { id: dto.schoolId } });
    if (!school) throw new BadRequestException('学校不存在');
    const scope = await this.resolveSchoolScope(actor);
    if (scope !== null && Number(dto.schoolId) !== scope) {
      throw new ForbiddenException('仅能为本校创建年级');
    }
    const entity = this.gradeRepo.create({
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
      schoolYear: dto.schoolYear,
      schoolId: dto.schoolId,
    });
    return this.gradeRepo.save(entity);
  }

  async update(id: number, dto: UpdateGradeDto, actor: RequestActor) {
    const row = await this.findOne(id, actor);
    Object.assign(row, dto);
    await this.gradeRepo.save(row);
    return this.findOne(id, actor);
  }

  async remove(id: number, actor: RequestActor) {
    await this.findOne(id, actor);
    await this.gradeRepo.delete(id);
  }

  async countBySchoolId(schoolId: number): Promise<number> {
    return this.gradeRepo.count({ where: { schoolId } });
  }
}
