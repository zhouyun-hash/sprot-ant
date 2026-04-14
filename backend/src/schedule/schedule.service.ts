import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolClass } from '../class/entities/school-class.entity';
import { canManageAllSchools, isSchoolAdminRole } from '../common/school-scope.util';
import { Teacher } from '../teacher/entities/teacher.entity';
import { CourseSchedule } from './entities/course-schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

type RequestUser = { id: number; role: string };

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(CourseSchedule)
    private readonly scheduleRepo: Repository<CourseSchedule>,
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
  ) {}

  private async getTeacherSchoolId(userId: number): Promise<number | null> {
    const t = await this.teacherRepo.findOne({ where: { userId } });
    return t?.schoolId != null ? Number(t.schoolId) : null;
  }

  /** 与班级模块一致：集团/系统管理员与学校管理员不按教师个人范围限制 */
  private async resolveScopeSchoolId(user: RequestUser): Promise<number | null> {
    if (canManageAllSchools(user.role) || isSchoolAdminRole(user.role)) {
      return null;
    }
    if (user.role === 'teacher') {
      const sid = await this.getTeacherSchoolId(user.id);
      if (sid == null) {
        throw new ForbiddenException('教师未绑定学校，无法访问课表数据');
      }
      return sid;
    }
    throw new ForbiddenException('无权限访问课表数据');
  }

  private async loadClassOrThrow(classId: number): Promise<SchoolClass> {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) {
      throw new BadRequestException('班级不存在');
    }
    return cls;
  }

  /** 任课教师须与班级同属一校（若填写） */
  private async assertScheduleTeacherMatchesClassSchool(
    classSchoolId: number | null,
    teacherRowId: number | null,
  ) {
    if (teacherRowId == null) return;
    const t = await this.teacherRepo.findOne({ where: { id: teacherRowId } });
    if (!t) {
      throw new BadRequestException('指定的任课教师不存在');
    }
    if (classSchoolId == null || t.schoolId == null) {
      throw new BadRequestException('班级或教师缺少学校归属，无法关联课表');
    }
    if (Number(t.schoolId) !== Number(classSchoolId)) {
      throw new BadRequestException('任课教师与班级所属学校不一致');
    }
  }

  private async assertTeacherCanAccessScheduleClass(
    user: RequestUser,
    classId: number,
  ) {
    const scope = await this.resolveScopeSchoolId(user);
    if (scope == null) return;
    const cls = await this.loadClassOrThrow(classId);
    if (cls.schoolId == null || Number(cls.schoolId) !== scope) {
      throw new ForbiddenException('无权限操作该校外班级的课表');
    }
  }

  async findAll(
    query: {
      classId?: number;
      teacherId?: number;
      dayOfWeek?: number;
      schoolYear?: string;
      semester?: number;
    },
    user: RequestUser,
  ) {
    const scope = await this.resolveScopeSchoolId(user);
    const qb = this.scheduleRepo
      .createQueryBuilder('cs')
      .leftJoin(SchoolClass, 'c', 'c.id = cs.class_id')
      .orderBy('cs.day_of_week', 'ASC')
      .addOrderBy('cs.period', 'ASC');

    if (scope != null) {
      qb.andWhere('c.school_id = :sid', { sid: scope });
    }

    if (query.classId) {
      qb.andWhere('cs.class_id = :classId', { classId: query.classId });
    }
    if (query.teacherId) {
      qb.andWhere('cs.teacher_id = :teacherId', { teacherId: query.teacherId });
    }
    if (query.dayOfWeek != null) {
      qb.andWhere('cs.day_of_week = :dow', { dow: query.dayOfWeek });
    }
    if (query.schoolYear) {
      qb.andWhere('cs.school_year = :sy', { sy: query.schoolYear });
    }
    if (query.semester != null) {
      qb.andWhere('cs.semester = :sem', { sem: query.semester });
    }

    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  async findOne(id: number, user: RequestUser) {
    const row = await this.scheduleRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('课表记录不存在');
    await this.assertTeacherCanAccessScheduleClass(user, row.classId);
    return row;
  }

  async create(dto: CreateScheduleDto, user: RequestUser) {
    await this.assertTeacherCanAccessScheduleClass(user, dto.classId);
    const cls = await this.loadClassOrThrow(dto.classId);
    await this.assertScheduleTeacherMatchesClassSchool(
      cls.schoolId ?? null,
      dto.teacherId ?? null,
    );
    return this.scheduleRepo.save(this.scheduleRepo.create(dto));
  }

  async update(id: number, dto: UpdateScheduleDto, user: RequestUser) {
    const existing = await this.scheduleRepo.findOneBy({ id });
    if (!existing) throw new NotFoundException('课表记录不存在');
    await this.assertTeacherCanAccessScheduleClass(user, existing.classId);

    const nextClassId = dto.classId ?? existing.classId;
    if (dto.classId != null) {
      await this.assertTeacherCanAccessScheduleClass(user, dto.classId);
    }
    const cls = await this.loadClassOrThrow(nextClassId);
    const nextTeacherId =
      dto.teacherId !== undefined ? dto.teacherId : existing.teacherId;
    await this.assertScheduleTeacherMatchesClassSchool(
      cls.schoolId ?? null,
      nextTeacherId ?? null,
    );

    await this.scheduleRepo.update(id, dto);
    return this.findOne(id, user);
  }

  async remove(id: number, user: RequestUser) {
    const row = await this.scheduleRepo.findOneBy({ id });
    if (!row) throw new NotFoundException('课表记录不存在');
    await this.assertTeacherCanAccessScheduleClass(user, row.classId);
    await this.scheduleRepo.delete(id);
  }
}
