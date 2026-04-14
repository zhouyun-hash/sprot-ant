import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { canManageAllSchools } from '../common/school-scope.util';
import { Grade } from '../grade/entities/grade.entity';
import { School } from '../school/entities/school.entity';
import { Score } from '../score/entities/score.entity';
import { SchoolClass } from './entities/school-class.entity';
import { Student } from '../student/entities/student.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { User } from '../user/entities/user.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { QueryClassDto } from './dto/query-class.dto';
import { QueryClassStudentsDto } from './dto/query-class-students.dto';

function stripUserPassword(user: User): Omit<User, 'password'> {
  const { password: _p, ...rest } = user;
  return rest;
}

type RequestUser = { id: number; role: string; username?: string };

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
  ) {}

  private async getTeacherOrThrow(teacherId: number): Promise<Teacher> {
    const t = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!t) {
      throw new BadRequestException('指定的教师不存在');
    }
    return t;
  }

  private async ensureSchoolAndGradeMatch(schoolId: number, gradeId: number) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) throw new BadRequestException('学校不存在');
    const grade = await this.gradeRepo.findOne({ where: { id: gradeId } });
    if (!grade) throw new BadRequestException('年级不存在');
    if (Number(grade.schoolId) !== Number(schoolId)) {
      throw new BadRequestException('所选年级不属于该学校');
    }
    return grade;
  }

  private async ensureTeacherInSchool(teacherId: number, schoolId: number) {
    const t = await this.getTeacherOrThrow(teacherId);
    if (Number(t.schoolId) !== Number(schoolId)) {
      throw new BadRequestException('教师与班级所属学校不一致');
    }
    return t;
  }

  private async resolveScopeSchoolId(user: RequestUser): Promise<number | null> {
    if (canManageAllSchools(user.role) || user.role === 'school_admin') {
      return null;
    }
    if (user.role === 'teacher') {
      const tByUserId = await this.teacherRepo.findOne({ where: { userId: user.id } });
      const t =
        tByUserId ??
        (user.username
          ? await this.teacherRepo.findOne({ where: { teacherNo: user.username } })
          : null);
      if (!t) {
        throw new ForbiddenException('教师未绑定教师档案，无法访问班级数据');
      }
      if (t.schoolId) {
        return Number(t.schoolId);
      }
      // 兼容历史数据：教师档案未绑定学校时，按其已任教班级推导学校范围
      const mapped = await this.classRepo
        .createQueryBuilder('c')
        .select('c.school_id', 'schoolId')
        .where('c.head_teacher_id = :tid OR c.pe_teacher_id = :tid', { tid: t.id })
        .limit(1)
        .getRawOne<{ schoolId?: number }>();
      if (mapped?.schoolId) {
        return Number(mapped.schoolId);
      }
      throw new ForbiddenException('教师未绑定学校且未关联班级，无法访问班级数据');
    }
    throw new ForbiddenException('无权限访问班级数据');
  }

  private async ensureUniqueBySchoolGrade(
    schoolId: number,
    gradeId: number,
    name: string,
    classNo: string,
    excludeId?: number,
  ) {
    const duplicateName = await this.classRepo
      .createQueryBuilder('c')
      .where('c.school_id = :schoolId', { schoolId })
      .andWhere('c.grade_id = :gradeId', { gradeId })
      .andWhere('c.name = :name', { name })
      .andWhere(excludeId ? 'c.id <> :excludeId' : '1=1', { excludeId })
      .getCount();
    if (duplicateName > 0) {
      throw new BadRequestException('同校同年级下班级名称不能重复');
    }
    const duplicateNo = await this.classRepo
      .createQueryBuilder('c')
      .where('c.school_id = :schoolId', { schoolId })
      .andWhere('c.grade_id = :gradeId', { gradeId })
      .andWhere('c.class_no = :classNo', { classNo })
      .andWhere(excludeId ? 'c.id <> :excludeId' : '1=1', { excludeId })
      .getCount();
    if (duplicateNo > 0) {
      throw new BadRequestException('同校同年级下班级编号不能重复');
    }
  }

  private async classHasStudentOrScoreData(classId: number): Promise<boolean> {
    const studentCount = await this.studentRepo.count({ where: { classId } });
    if (studentCount > 0) return true;
    const scoreCount = await this.scoreRepo
      .createQueryBuilder('s')
      .innerJoin('s.student', 'st')
      .where('st.class_id = :classId', { classId })
      .getCount();
    return scoreCount > 0;
  }

  async create(dto: CreateClassDto, user: RequestUser) {
    const scopeSchoolId = await this.resolveScopeSchoolId(user);
    if (scopeSchoolId !== null && Number(dto.schoolId) !== scopeSchoolId) {
      throw new ForbiddenException('仅可创建本校班级');
    }
    const grade = await this.ensureSchoolAndGradeMatch(dto.schoolId, dto.gradeId);
    await this.ensureTeacherInSchool(dto.headTeacherId, dto.schoolId);
    await this.ensureTeacherInSchool(dto.peTeacherId, dto.schoolId);
    await this.ensureUniqueBySchoolGrade(
      dto.schoolId,
      dto.gradeId,
      dto.name.trim(),
      dto.classNo.trim(),
    );
    const entity = this.classRepo.create({
      schoolId: dto.schoolId,
      gradeId: dto.gradeId,
      name: dto.name.trim(),
      classNo: dto.classNo.trim(),
      grade: grade.name,
      schoolYear: dto.schoolYear,
      headTeacherId: dto.headTeacherId,
      peTeacherId: dto.peTeacherId,
      // 兼容历史字段 teacherId，保持为班主任
      teacherId: dto.teacherId ?? dto.headTeacherId,
    });
    const saved = await this.classRepo.save(entity);
    return this.findOne(saved.id, user);
  }

  async findAll(query: QueryClassDto, user: RequestUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const scopeSchoolId = await this.resolveScopeSchoolId(user);
    const qb = this.classRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.school', 'sch')
      .leftJoinAndSelect('c.gradeRef', 'gr')
      .leftJoinAndSelect('c.headTeacher', 'ht')
      .leftJoinAndSelect('ht.user', 'htu')
      .leftJoinAndSelect('c.peTeacher', 'pt')
      .leftJoinAndSelect('pt.user', 'ptu')
      .orderBy('c.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (scopeSchoolId !== null) {
      qb.andWhere('c.school_id = :sid', { sid: scopeSchoolId });
    } else if (query.schoolId) {
      qb.andWhere('c.school_id = :sid', { sid: query.schoolId });
    }
    if (query.gradeId) {
      qb.andWhere('c.grade_id = :gid', { gid: query.gradeId });
    }
    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((c) => this.serializeClass(c)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number, user: RequestUser) {
    const scopeSchoolId = await this.resolveScopeSchoolId(user);
    const row = await this.classRepo.findOne({
      where: { id },
      relations: [
        'school',
        'gradeRef',
        'headTeacher',
        'headTeacher.user',
        'peTeacher',
        'peTeacher.user',
      ],
    });
    if (!row) {
      throw new NotFoundException('班级不存在');
    }
    if (scopeSchoolId !== null && Number(row.schoolId) !== scopeSchoolId) {
      throw new ForbiddenException('无权查看该班级');
    }
    return this.serializeClass(row);
  }

  async update(id: number, dto: UpdateClassDto, user: RequestUser) {
    const row = await this.classRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('班级不存在');
    }
    const scopeSchoolId = await this.resolveScopeSchoolId(user);
    if (scopeSchoolId !== null && Number(row.schoolId) !== scopeSchoolId) {
      throw new ForbiddenException('无权修改该班级');
    }
    const changingSchoolOrGrade =
      (dto.schoolId !== undefined && Number(dto.schoolId) !== Number(row.schoolId)) ||
      (dto.gradeId !== undefined && Number(dto.gradeId) !== Number(row.gradeId));
    if (changingSchoolOrGrade) {
      const hasData = await this.classHasStudentOrScoreData(id);
      if (hasData) {
        throw new BadRequestException(
          '该班级已有关联学生或成绩数据，禁止修改所属学校/年级',
        );
      }
    }
    const nextSchoolId = dto.schoolId ?? row.schoolId;
    if (scopeSchoolId !== null && Number(nextSchoolId) !== scopeSchoolId) {
      throw new ForbiddenException('仅可维护本校班级');
    }
    const nextGradeId = dto.gradeId ?? row.gradeId;
    const nextName = (dto.name ?? row.name).trim();
    const nextClassNo = (dto.classNo ?? row.classNo ?? '').trim();
    if (!nextClassNo) {
      throw new BadRequestException('班级编号不能为空');
    }
    const grade = await this.ensureSchoolAndGradeMatch(nextSchoolId, nextGradeId);
    await this.ensureUniqueBySchoolGrade(
      nextSchoolId,
      nextGradeId,
      nextName,
      nextClassNo,
      row.id,
    );

    if (dto.name !== undefined) {
      row.name = dto.name.trim();
    }
    if (dto.classNo !== undefined) row.classNo = dto.classNo.trim();
    if (dto.schoolId !== undefined) row.schoolId = dto.schoolId;
    if (dto.gradeId !== undefined) row.gradeId = dto.gradeId;
    row.grade = grade.name;
    if (dto.schoolYear !== undefined) {
      row.schoolYear = dto.schoolYear;
    }
    if (dto.headTeacherId !== undefined) {
      if (dto.headTeacherId === null) {
        throw new BadRequestException('班主任不能为空');
      }
      await this.ensureTeacherInSchool(dto.headTeacherId, row.schoolId);
      row.headTeacherId = dto.headTeacherId;
      row.teacherId = dto.headTeacherId;
    }
    if (dto.peTeacherId !== undefined) {
      if (dto.peTeacherId === null) {
        throw new BadRequestException('体育老师不能为空');
      }
      await this.ensureTeacherInSchool(dto.peTeacherId, row.schoolId);
      row.peTeacherId = dto.peTeacherId;
    }
    if (dto.teacherId !== undefined) {
      if (dto.teacherId === null) {
        row.teacherId = null;
      } else {
        await this.ensureTeacherInSchool(dto.teacherId, row.schoolId);
        row.teacherId = dto.teacherId;
        row.headTeacherId = dto.teacherId;
      }
    }
    await this.classRepo.save(row);
    return this.findOne(id, user);
  }

  async remove(id: number, user: RequestUser) {
    const row = await this.classRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('班级不存在');
    }
    const scopeSchoolId = await this.resolveScopeSchoolId(user);
    if (scopeSchoolId !== null && Number(row.schoolId) !== scopeSchoolId) {
      throw new ForbiddenException('无权删除该班级');
    }
    const count = await this.studentRepo.count({ where: { classId: id } });
    if (count > 0) {
      throw new BadRequestException('班级下仍有学生，无法删除');
    }
    await this.classRepo.remove(row);
    return { ok: true };
  }

  async findStudentsByClassId(
    classId: number,
    query: QueryClassStudentsDto,
    user: RequestUser,
  ) {
    const row = await this.classRepo.findOne({ where: { id: classId } });
    if (!row) {
      throw new NotFoundException('班级不存在');
    }
    const scopeSchoolId = await this.resolveScopeSchoolId(user);
    if (scopeSchoolId !== null && Number(row.schoolId) !== scopeSchoolId) {
      throw new ForbiddenException('无权查看该班级学生');
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [rows, total] = await this.studentRepo.findAndCount({
      where: { classId },
      relations: ['user'],
      order: { id: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: rows.map((s) => ({
        id: s.id,
        userId: s.userId,
        classId: s.classId,
        studentNo: s.studentNo,
        parentPhone: s.parentPhone,
        gender: s.gender,
        user: stripUserPassword(s.user),
      })),
      total,
      page,
      pageSize,
    };
  }

  private serializeClass(c: SchoolClass) {
    const base = {
      id: c.id,
      schoolId: c.schoolId,
      gradeId: c.gradeId,
      name: c.name,
      classNo: c.classNo,
      grade: c.grade,
      schoolYear: c.schoolYear,
      teacherId: c.teacherId,
      headTeacherId: c.headTeacherId,
      peTeacherId: c.peTeacherId,
      school: c.school
        ? { id: c.school.id, name: c.school.name, code: c.school.code }
        : null,
      gradeInfo: c.gradeRef
        ? {
            id: c.gradeRef.id,
            name: c.gradeRef.name,
            schoolYear: c.gradeRef.schoolYear,
          }
        : null,
    };
    const ht = c.headTeacher;
    const pt = c.peTeacher;
    return {
      ...base,
      headTeacher: ht
        ? {
            id: ht.id,
            teacherNo: ht.teacherNo,
            subject: ht.subject,
            user: ht.user ? stripUserPassword(ht.user) : null,
          }
        : null,
      peTeacher: pt
        ? {
            id: pt.id,
            teacherNo: pt.teacherNo,
            subject: pt.subject,
            user: pt.user ? stripUserPassword(pt.user) : null,
          }
        : null,
      // 兼容历史字段
      teacher: ht
        ? {
            id: ht.id,
            teacherNo: ht.teacherNo,
            subject: ht.subject,
            user: ht.user ? stripUserPassword(ht.user) : null,
          }
        : null,
    };
  }
}
