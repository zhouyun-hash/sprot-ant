import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { canManageAllSchools } from '../common/school-scope.util';
import { SchoolClass } from '../class/entities/school-class.entity';
import { School } from '../school/entities/school.entity';
import { Student } from '../student/entities/student.entity';
import { User } from '../user/entities/user.entity';
import { Teacher } from './entities/teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

const BCRYPT_ROUNDS = 10;

type RequestActor = { id: number; role: string };

@Injectable()
export class TeacherService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async create(dto: CreateTeacherDto, actor: RequestActor) {
    if (!canManageAllSchools(actor.role)) {
      throw new ForbiddenException('仅集团/系统管理员可新增教师');
    }
    await this.ensureSchoolExists(dto.schoolId);
    await this.ensureTeacherNoUnique(dto.teacherNo, dto.schoolId);
    const created = await this.createTeacherWithUser({
      schoolId: dto.schoolId,
      name: dto.name,
      teacherNo: dto.teacherNo,
      subject: dto.subject?.trim() || '体育',
      phone: dto.phone ?? null,
    });
    return this.findOne(created.id);
  }

  /**
   * 当前登录用户（教师）所带班级列表，含学生人数。
   */
  async findMyClasses(userId: number) {
    const teacher = await this.teacherRepo.findOne({ where: { userId } });
    if (!teacher) {
      throw new NotFoundException('未找到教师档案');
    }
    const classes = await this.classRepo.find({
      where: { teacherId: teacher.id },
      order: { id: 'ASC' },
    });
    const items = await Promise.all(
      classes.map(async (c) => {
        const studentCount = await this.studentRepo.count({
          where: { classId: c.id },
        });
        return {
          id: c.id,
          name: c.name,
          grade: c.grade,
          schoolYear: c.schoolYear,
          studentCount,
        };
      }),
    );
    return { items };
  }

  async findAll(query: QueryTeacherDto, actor: RequestActor) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const qb = this.teacherRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'u')
      .leftJoinAndSelect('t.school', 'sch')
      .orderBy('t.id', 'ASC');

    if (actor.role === 'teacher') {
      const me = await this.teacherRepo.findOne({ where: { userId: actor.id } });
      if (!me?.schoolId) {
        throw new ForbiddenException('教师未绑定学校');
      }
      qb.andWhere('t.school_id = :sid', { sid: me.schoolId });
    } else if (canManageAllSchools(actor.role) && query.schoolId != null && query.schoolId > 0) {
      qb.andWhere('t.school_id = :fsid', { fsid: query.schoolId });
    }

    const [rows, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: rows.map((t) => this.serializeTeacher(t)),
      total,
      page,
      pageSize,
    };
  }

  async update(id: number, dto: UpdateTeacherDto, actor: RequestActor) {
    const row = await this.teacherRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!row) {
      throw new NotFoundException('教师不存在');
    }

    if (dto.schoolId !== undefined) {
      if (!canManageAllSchools(actor.role)) {
        throw new ForbiddenException('无权修改教师所属学校');
      }
      await this.ensureSchoolExists(dto.schoolId);
      row.schoolId = dto.schoolId;
    }

    if (dto.teacherNo !== undefined && dto.teacherNo !== row.teacherNo) {
      const sid = row.schoolId ?? dto.schoolId;
      if (!sid) {
        throw new BadRequestException('请先为教师绑定学校后再修改工号');
      }
      await this.ensureTeacherNoUnique(dto.teacherNo, sid);
      row.teacherNo = dto.teacherNo;
    }
    if (dto.subject !== undefined) {
      row.subject = dto.subject?.trim() || '体育';
    }
    if (dto.name !== undefined && row.user) {
      row.user.name = dto.name;
      await this.userRepo.save(row.user);
    }
    if (dto.phone !== undefined && row.user) {
      row.user.phone = dto.phone ? dto.phone : null;
      await this.userRepo.save(row.user);
    }
    await this.teacherRepo.save(row);
    return this.findOne(id);
  }

  async remove(id: number, actor: RequestActor) {
    if (!canManageAllSchools(actor.role)) {
      throw new ForbiddenException('仅集团/系统管理员可删除教师');
    }
    const row = await this.teacherRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('教师不存在');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Teacher, { id: row.id });
      await manager.delete(User, { id: row.userId });
    });
    return { ok: true };
  }

  private async findOne(id: number) {
    const row = await this.teacherRepo.findOne({
      where: { id },
      relations: ['user', 'school'],
    });
    if (!row) {
      throw new NotFoundException('教师不存在');
    }
    return this.serializeTeacher(row);
  }

  private async ensureSchoolExists(schoolId: number) {
    const ok = await this.schoolRepo.exist({ where: { id: schoolId } });
    if (!ok) throw new BadRequestException('学校不存在');
  }

  private async createTeacherWithUser(input: {
    schoolId: number;
    name: string;
    teacherNo: string;
    subject: string;
    phone: string | null;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const username = await this.genUniqueUsername(input.teacherNo);
      const rawPassword = input.phone?.slice(-6) || '123456';
      const password = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);
      const user = queryRunner.manager.create(User, {
        username,
        password,
        role: 'teacher',
        name: input.name,
        phone: input.phone,
      });
      const savedUser = await queryRunner.manager.save(User, user);
      const teacher = queryRunner.manager.create(Teacher, {
        userId: savedUser.id,
        schoolId: input.schoolId,
        teacherNo: input.teacherNo,
        subject: input.subject,
      });
      const savedTeacher = await queryRunner.manager.save(Teacher, teacher);
      await queryRunner.commitTransaction();
      return savedTeacher;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  private async ensureTeacherNoUnique(teacherNo: string, schoolId: number) {
    const exists = await this.teacherRepo.exist({ where: { teacherNo, schoolId } });
    if (exists) {
      throw new BadRequestException(`该校下教师工号已存在: ${teacherNo}`);
    }
  }

  private async genUniqueUsername(base: string) {
    const pure = base.replace(/\s+/g, '');
    let candidate = pure;
    for (let i = 0; i < 5; i++) {
      const exists = await this.userRepo.exist({ where: { username: candidate } });
      if (!exists) {
        return candidate;
      }
      candidate = `${pure}_${randomUUID().slice(0, 6)}`;
    }
    return `${pure}_${Date.now()}`;
  }

  private serializeTeacher(t: Teacher) {
    const user = t.user;
    const sch = t.school;
    return {
      id: t.id,
      userId: t.userId,
      schoolId: t.schoolId,
      school: sch
        ? { id: sch.id, name: sch.name, code: sch.code }
        : null,
      teacherNo: t.teacherNo,
      subject: t.subject,
      user: user
        ? {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            phone: user.phone,
            avatar: user.avatar,
            createdAt: user.createdAt,
          }
        : null,
    };
  }
}
