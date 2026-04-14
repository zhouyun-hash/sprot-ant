import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SchoolClass } from '../class/entities/school-class.entity';
import { Student } from '../student/entities/student.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { User } from '../user/entities/user.entity';
import {
  ParentAccessStatus,
  ParentStudentAccess,
} from './entities/parent-student-access.entity';

function normPhone(s: string | null | undefined): string {
  return (s ?? '').trim();
}

function normIdCard(s: string): string {
  return s.trim().toUpperCase();
}

@Injectable()
export class ParentStudentAccessService {
  constructor(
    @InjectRepository(ParentStudentAccess)
    private readonly accessRepo: Repository<ParentStudentAccess>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async hasAnyStudentWithParentPhone(phone: string): Promise<boolean> {
    const p = normPhone(phone);
    if (!p) return false;
    const n = await this.studentRepo
      .createQueryBuilder('s')
      .where('TRIM(s.parent_phone) = :p', { p })
      .getCount();
    return n > 0;
  }

  async findApproved(parentUserId: number, studentId: number) {
    return this.accessRepo.findOne({
      where: {
        parentUserId,
        studentId,
        status: 'approved' as ParentAccessStatus,
      },
    });
  }

  async ensureApprovedAccess(parentUserId: number, studentId: number) {
    const row = await this.findApproved(parentUserId, studentId);
    if (!row) {
      throw new ForbiddenException('教师未开放该学生的体育数据查看权限');
    }
    return row;
  }

  async apply(parentUserId: number, studentNo: string, idCard: string) {
    const parent = await this.userRepo.findOne({ where: { id: parentUserId } });
    const phone = normPhone(parent?.phone);
    if (!parent || parent.role !== 'parent' || !phone) {
      throw new ForbiddenException('仅家长可提交申请');
    }
    const card = normIdCard(idCard);
    const no = studentNo.trim();
    const student = await this.studentRepo.findOne({
      where: { studentNo: no },
      relations: ['schoolClass'],
    });
    if (!student) {
      throw new BadRequestException('未找到该学号，请核对');
    }
    if (normPhone(student.parentPhone) !== phone) {
      throw new BadRequestException('该学号与您登记的家长手机号不匹配');
    }
    const dbCard = normIdCard((student.idCard ?? '').trim());
    if (!dbCard || dbCard !== card) {
      throw new BadRequestException('身份证号与学校登记信息不一致，请核对');
    }
    const existed = await this.accessRepo.findOne({
      where: { parentUserId, studentId: student.id },
    });
    if (existed) {
      if (existed.status === 'rejected') {
        existed.status = 'pending';
        existed.reviewedAt = null;
        existed.reviewedByUserId = null;
        await this.accessRepo.save(existed);
      }
      return { id: existed.id, status: existed.status, studentId: student.id };
    }
    const created = await this.accessRepo.save(
      this.accessRepo.create({
        parentUserId,
        studentId: student.id,
        status: 'pending',
      }),
    );
    return { id: created.id, status: created.status, studentId: student.id };
  }

  async listMyRequests(parentUserId: number) {
    const rows = await this.accessRepo.find({
      where: { parentUserId },
      order: { id: 'DESC' },
    });
    if (!rows.length) return { items: [] };
    const studentIds = rows.map((r) => r.studentId);
    const students = await this.studentRepo.find({
      where: { id: In(studentIds) },
      relations: ['user', 'schoolClass'],
    });
    const byId = new Map(students.map((s) => [Number(s.id), s]));
    return {
      items: rows.map((r) => {
        const s = byId.get(Number(r.studentId));
        return {
          id: r.id,
          studentId: r.studentId,
          status: r.status,
          createdAt: r.createdAt,
          reviewedAt: r.reviewedAt,
          student: s
            ? {
                id: s.id,
                studentNo: s.studentNo,
                name: s.user?.name,
                className: s.schoolClass?.name,
                grade: s.schoolClass?.grade,
              }
            : null,
        };
      }),
    };
  }

  private async teacherRecordForUser(userId: number) {
    return this.teacherRepo.findOne({ where: { userId } });
  }

  async listPendingForTeacher(teacherUserId: number, role: string) {
    if (role === 'admin' || role === 'super_admin') {
      const pending = await this.accessRepo.find({
        where: { status: 'pending' },
        order: { id: 'ASC' },
      });
      if (!pending.length) return { items: [] };
      const studentIds = pending.map((p) => p.studentId);
      const students = await this.studentRepo.find({
        where: { id: In(studentIds) },
        relations: ['user', 'schoolClass'],
      });
      const byId = new Map(students.map((s) => [Number(s.id), s]));
      return {
        items: pending.map((r) => {
          const s = byId.get(Number(r.studentId));
          return {
            id: r.id,
            status: r.status,
            createdAt: r.createdAt,
            student: s
              ? {
                  id: s.id,
                  studentNo: s.studentNo,
                  name: s.user?.name,
                  className: s.schoolClass?.name,
                  grade: s.schoolClass?.grade,
                }
              : { id: r.studentId },
          };
        }),
      };
    }

    const teacher = await this.teacherRecordForUser(teacherUserId);
    if (!teacher) {
      throw new ForbiddenException('仅教师可操作');
    }
    const classes = await this.classRepo.find({
      where: { teacherId: teacher.id },
      select: ['id'],
    });
    const classIds = classes.map((c) => c.id);
    if (!classIds.length) {
      return { items: [] };
    }
    const pending = await this.accessRepo.find({
      where: { status: 'pending' },
      order: { id: 'ASC' },
    });
    const studentIds = pending.map((p) => p.studentId);
    if (!studentIds.length) {
      return { items: [] };
    }
    const students = await this.studentRepo.find({
      where: { id: In(studentIds) },
      relations: ['user', 'schoolClass'],
    });
    const byId = new Map(students.map((s) => [Number(s.id), s]));
    const items = pending
      .filter((r) => {
        const s = byId.get(Number(r.studentId));
        return s && classIds.includes(Number(s.classId));
      })
      .map((r) => {
        const s = byId.get(Number(r.studentId))!;
        return {
          id: r.id,
          status: r.status,
          createdAt: r.createdAt,
          student: {
            id: s.id,
            studentNo: s.studentNo,
            name: s.user?.name,
            className: s.schoolClass?.name,
            grade: s.schoolClass?.grade,
          },
        };
      });
    return { items };
  }

  async approve(requestId: number, teacherUserId: number, role: string) {
    const req = await this.accessRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException('申请不存在');
    const student = await this.studentRepo.findOne({ where: { id: req.studentId } });
    if (!student) throw new NotFoundException('学生不存在');

    if (role !== 'admin' && role !== 'super_admin') {
      const teacher = await this.teacherRecordForUser(teacherUserId);
      if (!teacher) {
        throw new ForbiddenException('仅教师可操作');
      }
      const cls = await this.classRepo.findOne({ where: { id: student.classId } });
      if (!cls || Number(cls.teacherId) !== Number(teacher.id)) {
        throw new ForbiddenException('无权审批该学生的申请');
      }
    }
    req.status = 'approved';
    req.reviewedByUserId = teacherUserId;
    req.reviewedAt = new Date();
    await this.accessRepo.save(req);
    return { ok: true, status: req.status };
  }

  async reject(requestId: number, teacherUserId: number, role: string) {
    const req = await this.accessRepo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException('申请不存在');
    const student = await this.studentRepo.findOne({ where: { id: req.studentId } });
    if (!student) throw new NotFoundException('学生不存在');

    if (role !== 'admin' && role !== 'super_admin') {
      const teacher = await this.teacherRecordForUser(teacherUserId);
      if (!teacher) {
        throw new ForbiddenException('仅教师可操作');
      }
      const cls = await this.classRepo.findOne({ where: { id: student.classId } });
      if (!cls || Number(cls.teacherId) !== Number(teacher.id)) {
        throw new ForbiddenException('无权审批该学生的申请');
      }
    }
    req.status = 'rejected';
    req.reviewedByUserId = teacherUserId;
    req.reviewedAt = new Date();
    await this.accessRepo.save(req);
    return { ok: true, status: req.status };
  }
}
