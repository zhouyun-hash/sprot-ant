import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource, MoreThan, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { TrainingRecord } from '../ai/entities/training-record.entity';
import { Score } from '../score/entities/score.entity';
import { SchoolClass } from '../class/entities/school-class.entity';
import { canManageAllSchools, isSchoolAdminRole } from '../common/school-scope.util';
import { Teacher } from '../teacher/entities/teacher.entity';
import { User } from '../user/entities/user.entity';
import { ParentStudentAccess } from '../parent/entities/parent-student-access.entity';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { QueryTrainingRecordDto } from './dto/query-training-record.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

const BCRYPT_ROUNDS = 10;
type RequestUser = { id: number; role: string; username?: string };

@Injectable()
export class StudentService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(TrainingRecord)
    private readonly trainingRecordRepo: Repository<TrainingRecord>,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(ParentStudentAccess)
    private readonly parentAccessRepo: Repository<ParentStudentAccess>,
  ) {}

  private async getTeacherSchoolId(
    userId: number,
    username?: string,
  ): Promise<number | null> {
    const tByUserId = await this.teacherRepo.findOne({ where: { userId } });
    const t =
      tByUserId ??
      (username
        ? await this.teacherRepo.findOne({ where: { teacherNo: username } })
        : null);
    if (!t) {
      return null;
    }
    if (t.schoolId != null) {
      return Number(t.schoolId);
    }
    // 兼容历史数据：教师档案未绑定学校时，按其已任教班级推导学校范围
    const mapped = await this.classRepo
      .createQueryBuilder('c')
      .select('c.school_id', 'schoolId')
      .where('c.head_teacher_id = :tid OR c.pe_teacher_id = :tid', { tid: t.id })
      .limit(1)
      .getRawOne<{ schoolId?: number }>();
    return mapped?.schoolId != null ? Number(mapped.schoolId) : null;
  }

  /** 列表/增删改/导入：仅集团/系统管理员、学校管理员、教师可操作 */
  private assertCanManageStudentList(user: RequestUser) {
    if (
      canManageAllSchools(user.role) ||
      isSchoolAdminRole(user.role) ||
      user.role === 'teacher'
    ) {
      return;
    }
    throw new ForbiddenException('无权限访问学生数据');
  }

  private async assertTeacherCanAccessClass(user: RequestUser, classId: number) {
    if (canManageAllSchools(user.role) || isSchoolAdminRole(user.role)) {
      return;
    }
    if (user.role !== 'teacher') {
      throw new ForbiddenException('无权限操作该学生');
    }
    const sid = await this.getTeacherSchoolId(user.id, user.username);
    if (sid == null) {
      throw new ForbiddenException('教师未绑定学校');
    }
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls || cls.schoolId == null || Number(cls.schoolId) !== sid) {
      throw new ForbiddenException('无权限操作该班级学生');
    }
  }

  private async assertTeacherCanAccessStudent(user: RequestUser, studentId: number) {
    if (canManageAllSchools(user.role) || isSchoolAdminRole(user.role)) {
      return;
    }
    if (user.role !== 'teacher') {
      return;
    }
    const sid = await this.getTeacherSchoolId(user.id, user.username);
    if (sid == null) {
      throw new ForbiddenException('教师未绑定学校');
    }
    const row = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['schoolClass'],
    });
    if (!row?.schoolClass) {
      throw new NotFoundException('学生不存在');
    }
    if (
      row.schoolClass.schoolId == null ||
      Number(row.schoolClass.schoolId) !== sid
    ) {
      throw new ForbiddenException('无权限操作该学生');
    }
  }

  /** 当前登录用户（学生）档案 */
  async findMineByUserId(userId: number) {
    const row = await this.studentRepo.findOne({
      where: { userId },
      relations: ['user', 'schoolClass'],
    });
    if (!row) {
      throw new NotFoundException('未找到学生档案');
    }
    return this.serializeStudent(row);
  }

  /**
   * 本周（近 7 天）运动概览：总时长（分钟）、训练次数、成绩达标率。
   * 时长由训练记录 resultJson 估算；无字段时按单次 8 分钟计。
   * 达标率：近 7 天成绩条目中 result 数值 ≥60 的比例（无数据为 0）。
   */
  async getMyWeekStats(userId: number) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) {
      throw new NotFoundException('未找到学生档案');
    }
    return this.getWeekStatsByStudentId(student.id);
  }

  /** 家长端 / 内部：按学生 ID 统计近 7 天概览 */
  async getWeekStatsByStudentId(studentId: number) {
    const exists = await this.studentRepo.exist({ where: { id: studentId } });
    if (!exists) {
      throw new NotFoundException('学生不存在');
    }
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const records = await this.trainingRecordRepo.find({
      where: { studentId, createdAt: MoreThan(weekAgo) },
      order: { id: 'DESC' },
    });
    const sessionCount = records.length;
    let totalMinutes = 0;
    for (const r of records) {
      totalMinutes += this.minutesFromTrainingResult(r.resultJson);
    }
    if (sessionCount > 0 && totalMinutes < 0.01) {
      totalMinutes = sessionCount * 8;
    }

    const scores = await this.scoreRepo.find({
      where: { studentId, createdAt: MoreThan(weekAgo) },
    });
    let passRate = 0;
    if (scores.length > 0) {
      const pass = scores.filter((s) => {
        const n = Number.parseFloat(s.result);
        return Number.isFinite(n) && n >= 60;
      }).length;
      passRate = Number((pass / scores.length).toFixed(4));
    }

    return {
      totalMinutes: Number(totalMinutes.toFixed(2)),
      sessionCount,
      passRate,
    };
  }

  /**
   * 近 7 个自然日（含当天）每日运动时长（分钟），用于折线图。
   */
  async getActivityTrend7Days(studentId: number) {
    const exists = await this.studentRepo.exist({ where: { id: studentId } });
    if (!exists) {
      throw new NotFoundException('学生不存在');
    }
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const records = await this.trainingRecordRepo
      .createQueryBuilder('t')
      .where('t.student_id = :sid', { sid: studentId })
      .andWhere('t.created_at >= :start', { start })
      .andWhere('t.created_at <= :end', { end })
      .orderBy('t.id', 'ASC')
      .getMany();

    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const labels: string[] = [];
    const indexByKey = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = dayKey(d);
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      indexByKey.set(k, i);
    }

    const values = new Array(7).fill(0);
    const countByDay = new Array(7).fill(0);

    for (const r of records) {
      const k = dayKey(new Date(r.createdAt));
      const idx = indexByKey.get(k);
      if (idx === undefined) continue;
      countByDay[idx] += 1;
      values[idx] += this.minutesFromTrainingResult(
        r.resultJson as Record<string, unknown> | null,
      );
    }
    for (let i = 0; i < 7; i++) {
      if (countByDay[i] > 0 && values[i] < 0.01) {
        values[i] = countByDay[i] * 8;
      }
      values[i] = Number(values[i].toFixed(2));
    }

    return { labels, values };
  }

  private minutesFromTrainingResult(
    json: Record<string, unknown> | null,
  ): number {
    if (!json || typeof json !== 'object') {
      return 0;
    }
    const m =
      json.duration_minutes ??
      json.durationMinutes ??
      json.minutes ??
      json.duration_m;
    if (typeof m === 'number' && Number.isFinite(m)) {
      return m;
    }
    const s = json.duration_seconds ?? json.durationSeconds;
    if (typeof s === 'number' && Number.isFinite(s)) {
      return s / 60;
    }
    return 0;
  }

  async create(dto: CreateStudentDto, user: RequestUser) {
    this.assertCanManageStudentList(user);
    await this.assertTeacherCanAccessClass(user, dto.classId);
    await this.ensureClassExists(dto.classId);
    await this.ensureStudentNoUnique(dto.studentNo);
    const created = await this.createStudentWithUser({
      name: dto.name,
      studentNo: dto.studentNo,
      classId: dto.classId,
      parentPhone: dto.parentPhone ?? null,
      idCard: dto.idCard?.trim() || null,
      gender: dto.gender ?? null,
    });
    return this.findOne(created.id, user);
  }

  async findAll(query: QueryStudentDto, user: RequestUser) {
    this.assertCanManageStudentList(user);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const qb = this.studentRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'u')
      .leftJoinAndSelect('s.schoolClass', 'c')
      .orderBy('s.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (user.role === 'teacher') {
      const sid = await this.getTeacherSchoolId(user.id, user.username);
      if (sid == null) {
        throw new ForbiddenException('教师未绑定学校');
      }
      qb.andWhere('c.school_id = :sid', { sid });
    }

    if (query.classId) {
      qb.andWhere('s.classId = :classId', { classId: query.classId });
    }
    if (query.schoolId) {
      qb.andWhere('c.school_id = :schoolId', { schoolId: query.schoolId });
    }
    if (query.gradeId) {
      qb.andWhere('c.grade_id = :gradeId', { gradeId: query.gradeId });
    }
    if (query.grade) {
      qb.andWhere('c.grade = :grade', { grade: query.grade });
    }
    if (query.name?.trim()) {
      qb.andWhere('u.name LIKE :name', { name: `%${query.name.trim()}%` });
    }
    if (query.studentNo?.trim()) {
      qb.andWhere('s.student_no LIKE :studentNo', {
        studentNo: `%${query.studentNo.trim()}%`,
      });
    }
    if (query.gender) {
      qb.andWhere('s.gender = :gender', { gender: query.gender });
    }

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((s) => this.serializeStudent(s)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number, user: RequestUser) {
    const row = await this.studentRepo.findOne({
      where: { id },
      relations: ['user', 'schoolClass'],
    });
    if (!row) {
      throw new NotFoundException('学生不存在');
    }
    if (user.role === 'student') {
      if (row.userId !== user.id) {
        throw new ForbiddenException('无权限查看该学生');
      }
      return this.serializeStudent(row);
    }
    if (user.role === 'teacher') {
      const sid = await this.getTeacherSchoolId(user.id, user.username);
      if (sid == null) {
        throw new ForbiddenException('教师未绑定学校');
      }
      if (
        row.schoolClass?.schoolId == null ||
        Number(row.schoolClass.schoolId) !== sid
      ) {
        throw new ForbiddenException('无权限查看该学生');
      }
      return this.serializeStudent(row);
    }
    return this.serializeStudent(row);
  }

  async update(id: number, dto: UpdateStudentDto, user: RequestUser) {
    this.assertCanManageStudentList(user);
    await this.assertTeacherCanAccessStudent(user, id);
    const row = await this.studentRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!row) {
      throw new NotFoundException('学生不存在');
    }

    if (dto.classId !== undefined) {
      await this.assertTeacherCanAccessClass(user, dto.classId);
      await this.ensureClassExists(dto.classId);
      row.classId = dto.classId;
    }
    if (dto.studentNo !== undefined && dto.studentNo !== row.studentNo) {
      await this.ensureStudentNoUnique(dto.studentNo);
      row.studentNo = dto.studentNo;
    }
    if (dto.parentPhone !== undefined) {
      row.parentPhone = dto.parentPhone ? dto.parentPhone : null;
    }
    if (dto.gender !== undefined) {
      row.gender = dto.gender;
    }
    if (dto.idCard !== undefined) {
      row.idCard = dto.idCard ? dto.idCard.trim().toUpperCase() : null;
    }

    if (dto.name !== undefined && row.user) {
      row.user.name = dto.name;
      await this.userRepo.save(row.user);
    }
    if (dto.parentPhone !== undefined && row.user) {
      row.user.phone = dto.parentPhone ? dto.parentPhone : null;
      await this.userRepo.save(row.user);
    }

    await this.studentRepo.save(row);
    return this.findOne(id, user);
  }

  async remove(id: number, user: RequestUser) {
    this.assertCanManageStudentList(user);
    await this.assertTeacherCanAccessStudent(user, id);
    const row = await this.studentRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('学生不存在');
    }
    await this.studentRepo.remove(row);
    return { ok: true };
  }

  async importFromExcel(fileBuffer: Buffer, user: RequestUser) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      throw new BadRequestException('Excel 文件为空');
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
      defval: '',
    });
    if (!rows.length) {
      throw new BadRequestException('Excel 无有效数据行');
    }

    this.assertCanManageStudentList(user);
    const teacherSchoolId =
      user.role === 'teacher'
        ? await this.getTeacherSchoolId(user.id, user.username)
        : null;
    if (user.role === 'teacher' && teacherSchoolId == null) {
      throw new ForbiddenException('教师未绑定学校');
    }

    let success = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 2;
      const row = rows[i];
      try {
        const name = String(row['姓名'] ?? '').trim();
        const studentNo = String(row['学号'] ?? '').trim();
        const className = String(row['班级'] ?? '').trim();
        const parentPhone = String(row['家长手机'] ?? '').trim();

        if (!name || !studentNo || !className) {
          throw new BadRequestException('姓名/学号/班级为必填');
        }
        const cls = await this.classRepo.findOne({
          where: {
            name: className,
            ...(teacherSchoolId != null ? { schoolId: teacherSchoolId } : {}),
          },
        });
        if (!cls) {
          throw new BadRequestException(`未找到班级: ${className}`);
        }
        await this.ensureStudentNoUnique(studentNo);
        const idCardRaw = String(row['身份证号'] ?? row['身份证'] ?? '').trim();
        await this.createStudentWithUser({
          name,
          studentNo,
          classId: cls.id,
          parentPhone: parentPhone || null,
          idCard: idCardRaw ? idCardRaw.toUpperCase() : null,
          gender: null,
        });
        success++;
      } catch (e) {
        errors.push({
          row: rowIndex,
          reason: (e as Error).message,
        });
      }
    }

    return {
      total: rows.length,
      success,
      failed: rows.length - success,
      errors,
    };
  }

  buildImportTemplate(): Buffer {
    const header = ['姓名', '学号', '班级', '家长手机', '身份证号'];
    const sample = ['张三', '20260001', '初一(1)班', '13900000000', ''];
    const ws = XLSX.utils.aoa_to_sheet([header, sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '学生导入模板');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async findTrainingRecordsByStudentId(
    studentId: number,
    query: QueryTrainingRecordDto,
    user: RequestUser,
  ) {
    await this.ensureTrainingRecordAccess(studentId, user);
    const exists = await this.studentRepo.exist({ where: { id: studentId } });
    if (!exists) {
      throw new NotFoundException('学生不存在');
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const [rows, total] = await this.trainingRecordRepo.findAndCount({
      where: { studentId },
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        userId: r.userId,
        project: r.project,
        resultJson: r.resultJson,
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findTrainingRecordDetail(
    studentId: number,
    recordId: number,
    user: RequestUser,
  ) {
    await this.ensureTrainingRecordAccess(studentId, user);
    const row = await this.trainingRecordRepo.findOne({
      where: { id: recordId },
    });
    if (!row || row.studentId !== studentId) {
      throw new NotFoundException('训练记录不存在');
    }
    return {
      id: row.id,
      studentId: row.studentId,
      userId: row.userId,
      project: row.project,
      resultJson: row.resultJson,
      createdAt: row.createdAt,
    };
  }

  private async ensureTrainingRecordAccess(studentId: number, user: RequestUser) {
    if (canManageAllSchools(user.role) || isSchoolAdminRole(user.role)) {
      return;
    }
    if (user.role === 'teacher') {
      const sid = await this.getTeacherSchoolId(user.id, user.username);
      if (sid == null) {
        throw new ForbiddenException('教师未绑定学校');
      }
      const student = await this.studentRepo.findOne({
        where: { id: studentId },
        relations: ['schoolClass'],
      });
      if (!student?.schoolClass) {
        throw new NotFoundException('学生不存在');
      }
      if (
        student.schoolClass.schoolId == null ||
        Number(student.schoolClass.schoolId) !== sid
      ) {
        throw new ForbiddenException('无权限查看该学生训练记录');
      }
      return;
    }
    if (user.role === 'parent') {
      const student = await this.studentRepo.findOne({ where: { id: studentId } });
      if (!student) {
        throw new NotFoundException('学生不存在');
      }
      const parentUser = await this.userRepo.findOne({ where: { id: user.id } });
      const phone = (parentUser?.phone ?? '').trim();
      if (!phone || (student.parentPhone ?? '').trim() !== phone) {
        throw new ForbiddenException('无权限查看该学生训练记录');
      }
      const approved = await this.parentAccessRepo.findOne({
        where: {
          parentUserId: user.id,
          studentId,
          status: 'approved',
        },
      });
      if (!approved) {
        throw new ForbiddenException('教师未开放该学生的体育数据查看权限');
      }
      return;
    }
    if (user.role !== 'student') {
      throw new ForbiddenException('无权限查看训练记录');
    }
    const selfStudent = await this.studentRepo.findOne({
      where: { userId: user.id },
    });
    if (!selfStudent || selfStudent.id !== studentId) {
      throw new ForbiddenException('仅可查看本人训练记录');
    }
  }

  private async createStudentWithUser(input: {
    name: string;
    studentNo: string;
    classId: number;
    parentPhone: string | null;
    idCard: string | null;
    gender: number | null;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const username = await this.genUniqueUsername(input.studentNo);
      const rawPassword = input.parentPhone?.slice(-6) || '123456';
      const password = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);
      const user = queryRunner.manager.create(User, {
        username,
        password,
        role: 'student',
        name: input.name,
        phone: input.parentPhone,
      });
      const savedUser = await queryRunner.manager.save(User, user);
      const student = queryRunner.manager.create(Student, {
        userId: savedUser.id,
        classId: input.classId,
        studentNo: input.studentNo,
        parentPhone: input.parentPhone,
        idCard: input.idCard,
        gender: input.gender,
      });
      const savedStudent = await queryRunner.manager.save(Student, student);
      await queryRunner.commitTransaction();
      return savedStudent;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  private async ensureClassExists(classId: number) {
    const ok = await this.classRepo.exist({ where: { id: classId } });
    if (!ok) {
      throw new BadRequestException('班级不存在');
    }
  }

  private async ensureStudentNoUnique(studentNo: string) {
    const exists = await this.studentRepo.exist({ where: { studentNo } });
    if (exists) {
      throw new BadRequestException(`学号已存在: ${studentNo}`);
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

  private serializeStudent(row: Student) {
    const { user, schoolClass } = row;
    return {
      id: row.id,
      userId: row.userId,
      classId: row.classId,
      studentNo: row.studentNo,
      parentPhone: row.parentPhone,
      idCard: row.idCard,
      gender: row.gender,
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
      classInfo: schoolClass
        ? {
            id: schoolClass.id,
            name: schoolClass.name,
            grade: schoolClass.grade,
            schoolYear: schoolClass.schoolYear,
          }
        : null,
    };
  }
}
