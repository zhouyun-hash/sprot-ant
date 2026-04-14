import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { In, Repository } from 'typeorm';
import { Student } from '../student/entities/student.entity';
import { User } from '../user/entities/user.entity';
import { AiGradeSubmissionDto } from './dto/ai-grade-submission.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { QueryHomeworkDto } from './dto/query-homework.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { HomeworkSubmission } from './entities/homework-submission.entity';
import { Homework } from './entities/homework.entity';

type RequestUser = { id: number; role: string };

@Injectable()
export class HomeworkService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Homework)
    private readonly homeworkRepo: Repository<Homework>,
    @InjectRepository(HomeworkSubmission)
    private readonly submissionRepo: Repository<HomeworkSubmission>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateHomeworkDto) {
    if (new Date(dto.deadline).getTime() <= Date.now()) {
      throw new BadRequestException('截止时间必须晚于当前时间');
    }
    const entity = this.homeworkRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      deadline: new Date(dto.deadline),
      classIds: dto.classIds,
      createdBy: dto.createdBy,
    });
    const saved = await this.homeworkRepo.save(entity);
    return this.findOne(saved.id);
  }

  async findAll(query: QueryHomeworkDto, user: RequestUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    if (user.role === 'teacher' || user.role === 'admin') {
      const [rows, total] = await this.homeworkRepo.findAndCount({
        order: { id: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      return { items: rows, total, page, pageSize };
    }

    const student = await this.studentRepo.findOne({
      where: { userId: user.id },
      relations: ['schoolClass'],
    });
    if (!student) {
      return { items: [], total: 0, page, pageSize };
    }
    return this.listHomeworkForStudent(student, query);
  }

  /** 家长查看孩子作业列表（与学生在作业列表口径一致） */
  async findAllForStudentId(studentId: number, query: QueryHomeworkDto) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['schoolClass'],
    });
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    if (!student) {
      return { items: [], total: 0, page, pageSize };
    }
    return this.listHomeworkForStudent(student, query);
  }

  private async listHomeworkForStudent(student: Student, query: QueryHomeworkDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const all = await this.homeworkRepo.find({ order: { id: 'DESC' } });
    let filtered = all.filter(
      (h) => Array.isArray(h.classIds) && h.classIds.includes(student.classId),
    );
    const hwIds = filtered.map((h) => h.id);
    const subMap = new Map<number, HomeworkSubmission>();
    if (hwIds.length > 0) {
      const subs = await this.submissionRepo.find({
        where: { studentId: student.id, homeworkId: In(hwIds) },
        order: { id: 'DESC' },
      });
      for (const s of subs) {
        if (!subMap.has(s.homeworkId)) {
          subMap.set(s.homeworkId, s);
        }
      }
    }
    if (query.submissionStatus === 'pending') {
      filtered = filtered.filter((h) => !subMap.has(h.id));
    } else if (query.submissionStatus === 'completed') {
      filtered = filtered.filter((h) => subMap.has(h.id));
    }
    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);
    const items = slice.map((h) => {
      const sub = subMap.get(h.id);
      return {
        id: h.id,
        title: h.title,
        description: h.description,
        deadline: h.deadline,
        classIds: h.classIds,
        createdBy: h.createdBy,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
        submission: sub
          ? {
              id: sub.id,
              status: sub.status,
              submittedAt: sub.submittedAt,
              videoUrl: sub.videoUrl,
            }
          : null,
      };
    });
    return { items, total: filtered.length, page, pageSize };
  }

  async findOne(id: number) {
    const row = await this.homeworkRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('作业不存在');
    }
    return row;
  }

  /** 学生/教师：作业详情；学生附带本人提交记录 */
  async findOneForViewer(id: number, user: RequestUser) {
    const row = await this.homeworkRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('作业不存在');
    }
    if (user.role === 'teacher' || user.role === 'admin') {
      return row;
    }
    if (user.role === 'parent') {
      throw new UnauthorizedException('请使用家长端专用接口查看作业详情');
    }
    const student = await this.studentRepo.findOne({ where: { userId: user.id } });
    if (!student) {
      throw new UnauthorizedException('无权限');
    }
    if (!row.classIds?.includes(student.classId)) {
      throw new UnauthorizedException('该作业不属于当前学生班级');
    }
    const sub = await this.submissionRepo.findOne({
      where: { homeworkId: id, studentId: student.id },
      order: { id: 'DESC' },
    });
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      deadline: row.deadline,
      classIds: row.classIds,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      submission: sub
        ? {
            id: sub.id,
            status: sub.status,
            submittedAt: sub.submittedAt,
            videoUrl: sub.videoUrl,
            teacherScore: sub.teacherScore,
            aiScore: sub.aiScore,
            comment: sub.comment,
          }
        : null,
    };
  }

  /** 家长查看指定孩子的作业详情（含提交） */
  async findOneForParentViewer(
    homeworkId: number,
    studentId: number,
    parentUserId: number,
  ) {
    const parent = await this.userRepo.findOne({ where: { id: parentUserId } });
    const phone = (parent?.phone ?? '').trim();
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (
      !parent ||
      parent.role !== 'parent' ||
      !phone ||
      !student ||
      (student.parentPhone ?? '').trim() !== phone
    ) {
      throw new ForbiddenException('无权限');
    }
    const row = await this.homeworkRepo.findOne({ where: { id: homeworkId } });
    if (!row) {
      throw new NotFoundException('作业不存在');
    }
    if (!row.classIds?.includes(student.classId)) {
      throw new UnauthorizedException('该作业不属于当前学生班级');
    }
    const sub = await this.submissionRepo.findOne({
      where: { homeworkId, studentId },
      order: { id: 'DESC' },
    });
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      deadline: row.deadline,
      classIds: row.classIds,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      submission: sub
        ? {
            id: sub.id,
            status: sub.status,
            submittedAt: sub.submittedAt,
            videoUrl: sub.videoUrl,
            teacherScore: sub.teacherScore,
            aiScore: sub.aiScore,
            comment: sub.comment,
          }
        : null,
    };
  }

  async update(id: number, dto: UpdateHomeworkDto) {
    const row = await this.homeworkRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('作业不存在');
    }
    if (dto.title !== undefined) row.title = dto.title;
    if (dto.description !== undefined) row.description = dto.description;
    if (dto.deadline !== undefined) row.deadline = new Date(dto.deadline);
    if (dto.classIds !== undefined) row.classIds = dto.classIds;
    await this.homeworkRepo.save(row);
    return this.findOne(id);
  }

  async remove(id: number) {
    const row = await this.homeworkRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('作业不存在');
    }
    await this.homeworkRepo.remove(row);
    return { ok: true };
  }

  async findSubmissions(homeworkId: number) {
    const exists = await this.homeworkRepo.exist({ where: { id: homeworkId } });
    if (!exists) {
      throw new NotFoundException('作业不存在');
    }
    const items = await this.submissionRepo.find({
      where: { homeworkId },
      relations: ['student', 'student.user', 'student.schoolClass'],
      order: { id: 'DESC' },
    });
    return {
      items: items.map((s) => ({
        id: s.id,
        homeworkId: s.homeworkId,
        studentId: s.studentId,
        content: s.content,
        videoUrl: s.videoUrl,
        status: s.status,
        teacherScore: s.teacherScore,
        aiScore: s.aiScore,
        comment: s.comment,
        submittedAt: s.submittedAt,
        student: {
          id: s.student.id,
          studentNo: s.student.studentNo,
          classId: s.student.classId,
          className: s.student.schoolClass?.name ?? null,
          user: s.student.user
            ? {
                id: s.student.user.id,
                name: s.student.user.name,
                username: s.student.user.username,
              }
            : null,
        },
      })),
      total: items.length,
    };
  }

  async submit(homeworkId: number, dto: SubmitHomeworkDto, user: RequestUser) {
    const homework = await this.homeworkRepo.findOne({ where: { id: homeworkId } });
    if (!homework) {
      throw new NotFoundException('作业不存在');
    }
    const student = await this.studentRepo.findOne({ where: { userId: user.id } });
    if (!student) {
      throw new UnauthorizedException('仅学生可提交作业');
    }
    if (!homework.classIds?.includes(student.classId)) {
      throw new UnauthorizedException('该作业不属于当前学生班级');
    }
    const existed = await this.submissionRepo.findOne({
      where: { homeworkId, studentId: student.id },
    });
    if (existed) {
      throw new BadRequestException('该作业已提交，不可重复提交');
    }
    const entity = this.submissionRepo.create({
      homeworkId,
      studentId: student.id,
      videoUrl: dto.videoUrl,
      content: null,
      status: 'submitted',
      teacherScore: null,
      comment: null,
      aiScore: null,
    });
    const saved = await this.submissionRepo.save(entity);
    return this.getSubmission(saved.id);
  }

  /** 家长代孩子提交（手机号与学生 parentPhone 一致） */
  async submitForParent(
    homeworkId: number,
    studentId: number,
    dto: SubmitHomeworkDto,
    parentUserId: number,
  ) {
    const parent = await this.userRepo.findOne({ where: { id: parentUserId } });
    const phone = (parent?.phone ?? '').trim();
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (
      !parent ||
      parent.role !== 'parent' ||
      !phone ||
      !student ||
      (student.parentPhone ?? '').trim() !== phone
    ) {
      throw new ForbiddenException('无权限代提交');
    }
    const homework = await this.homeworkRepo.findOne({ where: { id: homeworkId } });
    if (!homework) {
      throw new NotFoundException('作业不存在');
    }
    if (!homework.classIds?.includes(student.classId)) {
      throw new UnauthorizedException('该作业不属于当前学生班级');
    }
    const existed = await this.submissionRepo.findOne({
      where: { homeworkId, studentId },
    });
    if (existed) {
      throw new BadRequestException('该作业已提交，不可重复提交');
    }
    const entity = this.submissionRepo.create({
      homeworkId,
      studentId,
      videoUrl: dto.videoUrl,
      content: null,
      status: 'submitted',
      teacherScore: null,
      comment: null,
      aiScore: null,
    });
    const saved = await this.submissionRepo.save(entity);
    return this.getSubmission(saved.id);
  }

  async gradeSubmission(submissionId: number, dto: GradeSubmissionDto, user: RequestUser) {
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw new UnauthorizedException('仅教师或管理员可批改作业');
    }
    const row = await this.submissionRepo.findOne({ where: { id: submissionId } });
    if (!row) {
      throw new NotFoundException('提交记录不存在');
    }
    row.teacherScore = dto.teacherScore;
    row.comment = dto.comment ?? null;
    row.status = 'graded';
    await this.submissionRepo.save(row);
    return this.getSubmission(row.id);
  }

  async aiGradeSubmission(submissionId: number, dto: AiGradeSubmissionDto, user: RequestUser) {
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw new UnauthorizedException('仅教师或管理员可调用 AI 批改');
    }
    const row = await this.submissionRepo.findOne({ where: { id: submissionId } });
    if (!row) {
      throw new NotFoundException('提交记录不存在');
    }
    if (!row.videoUrl) {
      throw new BadRequestException('该提交未包含视频地址');
    }
    const homework = await this.homeworkRepo.findOne({ where: { id: row.homeworkId } });
    const baseUrl = this.config.get<string>('AI_PLATFORM_BASE_URL', 'http://127.0.0.1:8000');
    const scene = dto.scene ?? inferSceneFromHomework(homework);
    const score = await this.requestAiScore({
      baseUrl,
      scene,
      videoUrl: row.videoUrl,
      imageBase64: dto.imageBase64,
      sessionId: dto.sessionId ?? `submission-${submissionId}`,
    });
    row.aiScore = score;
    row.status = 'ai_graded';
    await this.submissionRepo.save(row);
    return this.getSubmission(row.id);
  }

  private async requestAiScore(options: {
    baseUrl: string;
    scene: 'action' | 'skipping' | 'situp';
    videoUrl: string;
    imageBase64?: string;
    sessionId?: string;
  }): Promise<number> {
    try {
      let score: number | null = null;
      const normalizedBase = options.baseUrl.replace(/\/+$/, '');
      if (options.scene === 'action') {
        const url = `${normalizedBase}/api/ai/vision/action`;
        const res = await axios.post(
          url,
          { video_url: options.videoUrl },
          { timeout: 15000 },
        );
        score = extractAiScore(res.data);
      } else if (options.imageBase64) {
        const url =
          options.scene === 'skipping'
            ? `${normalizedBase}/api/ai/skipping`
            : `${normalizedBase}/api/ai/situp`;
        const res = await axios.post(
          url,
          {
            image_base64: options.imageBase64,
            session_id: options.sessionId ?? 'homework-ai-grade',
            reset: false,
          },
          { timeout: 15000 },
        );
        score = extractAiScore(res.data);
      } else {
        // 未提供 imageBase64 时，跳绳/仰卧起坐降级为动作识别
        const url = `${normalizedBase}/api/ai/vision/action`;
        const res = await axios.post(
          url,
          { video_url: options.videoUrl },
          { timeout: 15000 },
        );
        score = extractAiScore(res.data);
      }
      if (score == null || Number.isNaN(score)) {
        return 75;
      }
      return Math.max(0, Math.min(100, Number(score)));
    } catch (e) {
      throw new BadRequestException(`AI 自动评分失败: ${(e as Error).message}`);
    }
  }

  private async getSubmission(submissionId: number) {
    const s = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['student', 'student.user', 'student.schoolClass'],
    });
    if (!s) {
      throw new NotFoundException('提交记录不存在');
    }
    return {
      id: s.id,
      homeworkId: s.homeworkId,
      studentId: s.studentId,
      videoUrl: s.videoUrl,
      teacherScore: s.teacherScore,
      aiScore: s.aiScore,
      comment: s.comment,
      status: s.status,
      submittedAt: s.submittedAt,
      student: s.student
        ? {
            id: s.student.id,
            studentNo: s.student.studentNo,
            classId: s.student.classId,
            className: s.student.schoolClass?.name ?? null,
            user: s.student.user
              ? {
                  id: s.student.user.id,
                  name: s.student.user.name,
                  username: s.student.user.username,
                }
              : null,
          }
        : null,
    };
  }
}

function extractAiScore(payload: any): number | null {
  const candidates = [
    payload?.confidence != null ? Number(payload.confidence) * 100 : null,
    payload?.count != null ? Math.min(100, Number(payload.count) * 5) : null,
    payload?.score,
    payload?.Score,
    payload?.raw?.score,
    payload?.raw?.Score,
    payload?.raw?.Data?.Score,
    payload?.raw?.Data?.score,
    payload?.raw?.Data?.confidence != null ? Number(payload.raw.Data.confidence) * 100 : null,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    const n = Number(c);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function inferSceneFromHomework(homework: Homework | null): 'action' | 'skipping' | 'situp' {
  if (!homework) {
    return 'action';
  }
  const text = `${homework.title ?? ''} ${homework.description ?? ''}`.toLowerCase();
  if (text.includes('跳绳')) {
    return 'skipping';
  }
  if (text.includes('仰卧起坐')) {
    return 'situp';
  }
  return 'action';
}
