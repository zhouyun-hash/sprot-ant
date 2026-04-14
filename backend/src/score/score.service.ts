import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Not, Repository } from 'typeorm';
import { canManageAllSchools, isSchoolAdminRole } from '../common/school-scope.util';
import { SchoolClass } from '../class/entities/school-class.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import {
  BatchCreateScoreDto,
  CreateScoreDto,
  CreateScoreItemDto,
} from './dto/create-score.dto';
import { QueryScoreDto } from './dto/query-score.dto';
import { ReviewScoreDto } from './dto/review-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { Score } from './entities/score.entity';
import { Student } from '../student/entities/student.entity';
import { Task } from '../task/entities/task.entity';

type RequestUser = { id: number; role: string };

@Injectable()
export class ScoreService {
  constructor(
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
  ) {}

  private async getTeacherSchoolId(userId: number): Promise<number | null> {
    const t = await this.teacherRepo.findOne({ where: { userId } });
    return t?.schoolId != null ? Number(t.schoolId) : null;
  }

  private async assertTeacherCanAccessStudentSchool(
    user: RequestUser,
    studentId: number,
  ) {
    if (canManageAllSchools(user.role) || isSchoolAdminRole(user.role)) {
      return;
    }
    if (user.role !== 'teacher') {
      return;
    }
    const sid = await this.getTeacherSchoolId(user.id);
    if (sid == null) {
      throw new ForbiddenException('教师未绑定学校');
    }
    const st = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['schoolClass'],
    });
    if (!st?.schoolClass) {
      throw new BadRequestException(`学生不存在: ${studentId}`);
    }
    if (Number(st.schoolClass.schoolId) !== sid) {
      throw new ForbiddenException('无权限操作该学生的成绩数据');
    }
  }

  async create(payload: CreateScoreDto | BatchCreateScoreDto, user: RequestUser) {
    const items = this.normalizeCreateItems(payload);
    if (!items.length) {
      throw new BadRequestException('至少录入一条成绩');
    }

    const saved: Score[] = [];
    for (const item of items) {
      await this.ensureTaskExists(item.taskId);
      await this.ensureStudentExists(item.studentId);
      await this.assertTeacherCanAccessStudentSchool(user, item.studentId);
      const entity = this.scoreRepo.create({
        taskId: item.taskId,
        studentId: item.studentId,
        project: item.project,
        result: item.result,
        unit: item.unit,
        reviewStatus: 'pending',
      });
      saved.push(await this.scoreRepo.save(entity));
    }
    return {
      items: await Promise.all(saved.map((s) => this.findOne(s.id, user))),
      total: saved.length,
    };
  }

  async findAll(query: QueryScoreDto, user: RequestUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const qb = this.scoreRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.student', 'st')
      .leftJoinAndSelect('st.user', 'u')
      .leftJoinAndSelect('st.schoolClass', 'c')
      .leftJoinAndSelect('s.task', 't')
      .orderBy('s.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (user.role === 'teacher') {
      const sid = await this.getTeacherSchoolId(user.id);
      if (sid == null) {
        throw new ForbiddenException('教师未绑定学校');
      }
      qb.andWhere('c.school_id = :sid', { sid });
    }

    if (query.taskId) qb.andWhere('s.taskId = :taskId', { taskId: query.taskId });
    if (query.studentId) qb.andWhere('s.studentId = :studentId', { studentId: query.studentId });
    if (query.classId) qb.andWhere('st.classId = :classId', { classId: query.classId });
    if (query.reviewStatus) qb.andWhere('s.reviewStatus = :reviewStatus', { reviewStatus: query.reviewStatus });

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((row) => this.serializeScore(row)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number, user: RequestUser) {
    const row = await this.scoreRepo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'student.schoolClass', 'task'],
    });
    if (!row) {
      throw new NotFoundException('成绩不存在');
    }
    if (user.role === 'teacher') {
      const sid = await this.getTeacherSchoolId(user.id);
      if (sid == null) {
        throw new ForbiddenException('教师未绑定学校');
      }
      const cls = row.student?.schoolClass;
      if (!cls || Number(cls.schoolId) !== sid) {
        throw new ForbiddenException('无权查看该成绩');
      }
    }
    return this.serializeScore(row);
  }

  /**
   * 某学生各体测项目的历史最好成绩（排除已驳回）；同项目多条时按成绩优劣取一条。
   * 优劣规则：单位为「秒」等时间类时数值越小越好，否则默认数值越大越好。
   */
  async getBestScoresPerProject(studentId: number) {
    const exists = await this.studentRepo.exist({ where: { id: studentId } });
    if (!exists) {
      throw new NotFoundException('学生不存在');
    }
    const rows = await this.scoreRepo.find({
      where: { studentId, reviewStatus: Not('rejected') },
      relations: ['task'],
    });
    const byProject = new Map<string, Score[]>();
    for (const r of rows) {
      const arr = byProject.get(r.project) ?? [];
      arr.push(r);
      byProject.set(r.project, arr);
    }
    const best: Score[] = [];
    for (const [, list] of byProject) {
      best.push(this.pickBestScore(list));
    }
    best.sort((a, b) => a.project.localeCompare(b.project, 'zh'));
    return {
      items: best.map((row) => ({
        id: row.id,
        project: row.project,
        result: row.result,
        unit: row.unit,
        reviewStatus: row.reviewStatus,
        createdAt: row.createdAt,
        task: row.task
          ? { id: row.task.id, name: row.task.name }
          : null,
      })),
    };
  }

  private pickBestScore(list: Score[]): Score {
    if (list.length === 1) return list[0];
    return list.reduce((best, cur) =>
      this.isScoreBetter(cur, best) ? cur : best,
    );
  }

  private isScoreBetter(a: Score, b: Score): boolean {
    const na = this.parseResultNumber(a.result);
    const nb = this.parseResultNumber(b.result);
    if (na === null && nb === null) return false;
    if (na === null) return false;
    if (nb === null) return true;
    const lower =
      this.unitLowerBetter(a.unit) || this.unitLowerBetter(b.unit);
    if (lower) return na < nb;
    return na > nb;
  }

  private parseResultNumber(result: string): number | null {
    const n = Number.parseFloat(String(result).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : null;
  }

  private unitLowerBetter(unit: string): boolean {
    const u = unit.trim().toLowerCase();
    if (u.includes('秒')) return true;
    if (u === 's' || u.startsWith('sec')) return true;
    return false;
  }

  async update(id: number, dto: UpdateScoreDto, user: RequestUser) {
    const row = await this.scoreRepo.findOne({
      where: { id },
      relations: ['student', 'student.schoolClass'],
    });
    if (!row) {
      throw new NotFoundException('成绩不存在');
    }
    await this.assertTeacherCanAccessStudentSchool(user, row.studentId);
    if (dto.project !== undefined) row.project = dto.project;
    if (dto.result !== undefined) row.result = dto.result;
    if (dto.unit !== undefined) row.unit = dto.unit;
    await this.scoreRepo.save(row);
    return this.findOne(id, user);
  }

  async review(dto: ReviewScoreDto, user: RequestUser) {
    const row = await this.scoreRepo.findOne({
      where: { id: dto.id },
      relations: ['student', 'student.schoolClass'],
    });
    if (!row) {
      throw new NotFoundException('成绩不存在');
    }
    await this.assertTeacherCanAccessStudentSchool(user, row.studentId);
    row.reviewStatus = dto.reviewStatus;
    row.reviewRemark = dto.reviewRemark ?? null;
    await this.scoreRepo.save(row);
    return this.findOne(row.id, user);
  }

  async buildExportExcel(query: QueryScoreDto, user: RequestUser): Promise<Buffer> {
    const list = await this.findAll(
      {
        ...query,
        page: 1,
        pageSize: 100000,
      },
      user,
    );
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('成绩');
    sheet.columns = [
      { header: '成绩ID', key: 'id', width: 12 },
      { header: '任务ID', key: 'taskId', width: 12 },
      { header: '任务名称', key: 'taskName', width: 20 },
      { header: '学生ID', key: 'studentId', width: 12 },
      { header: '学生姓名', key: 'studentName', width: 16 },
      { header: '班级', key: 'className', width: 16 },
      { header: '项目', key: 'project', width: 16 },
      { header: '成绩', key: 'result', width: 12 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '复核状态', key: 'reviewStatus', width: 12 },
      { header: '复核备注', key: 'reviewRemark', width: 24 },
      { header: '录入时间', key: 'createdAt', width: 24 },
    ];

    for (const item of list.items) {
      sheet.addRow({
        id: item.id,
        taskId: item.taskId,
        taskName: item.task?.name ?? '',
        studentId: item.studentId,
        studentName: item.student?.user?.name ?? '',
        className: item.student?.classInfo?.name ?? '',
        project: item.project,
        result: item.result,
        unit: item.unit,
        reviewStatus: item.reviewStatus,
        reviewRemark: item.reviewRemark ?? '',
        createdAt: item.createdAt,
      });
    }
    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  private normalizeCreateItems(
    payload: CreateScoreDto | BatchCreateScoreDto,
  ): CreateScoreItemDto[] {
    if ('items' in payload && Array.isArray(payload.items)) {
      return payload.items;
    }
    return [payload as CreateScoreItemDto];
  }

  private async ensureTaskExists(taskId: number) {
    const exists = await this.taskRepo.exist({ where: { id: taskId } });
    if (!exists) throw new BadRequestException(`任务不存在: ${taskId}`);
  }

  private async ensureStudentExists(studentId: number) {
    const exists = await this.studentRepo.exist({ where: { id: studentId } });
    if (!exists) throw new BadRequestException(`学生不存在: ${studentId}`);
  }

  private serializeScore(row: Score) {
    const st = row.student;
    const user = st?.user;
    return {
      id: row.id,
      taskId: row.taskId,
      studentId: row.studentId,
      project: row.project,
      result: row.result,
      unit: row.unit,
      reviewStatus: row.reviewStatus,
      reviewRemark: row.reviewRemark,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      task: row.task
        ? {
            id: row.task.id,
            name: row.task.name,
            type: row.task.type,
            status: row.task.status,
          }
        : null,
      student: st
        ? {
            id: st.id,
            userId: st.userId,
            studentNo: st.studentNo,
            classId: st.classId,
            classInfo: st.schoolClass
              ? {
                  id: st.schoolClass.id,
                  name: st.schoolClass.name,
                  grade: st.schoolClass.grade,
                }
              : null,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  name: user.name,
                  phone: user.phone,
                }
              : null,
          }
        : null,
    };
  }
}
