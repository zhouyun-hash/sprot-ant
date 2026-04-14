import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiRecord } from '../ai/entities/ai-record.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { QueryAlertDto } from './dto/query-alert.dto';
import { Alert } from './entities/alert.entity';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
    @InjectRepository(AiRecord)
    private readonly aiRecordRepo: Repository<AiRecord>,
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
  ) {}

  async getAlerts(query: QueryAlertDto, user: { id: number; role: string }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const qb = this.alertRepo
      .createQueryBuilder('a')
      .leftJoin('student', 'st', 'st.id = a.student_id')
      .leftJoin('user', 'u', 'u.id = st.user_id')
      .leftJoin('school_class', 'c', 'c.id = st.class_id')
      .select('a.id', 'id')
      .addSelect('a.class_id', 'classId')
      .addSelect('a.student_id', 'studentId')
      .addSelect('a.type', 'type')
      .addSelect('a.message', 'message')
      .addSelect('a.status', 'status')
      .addSelect('a.violation_count', 'violationCount')
      .addSelect('a.period_date', 'periodDate')
      .addSelect('a.resolved_at', 'resolvedAt')
      .addSelect('a.created_at', 'createdAt')
      .addSelect('u.name', 'studentName')
      .addSelect('st.student_no', 'studentNo')
      .addSelect('c.name', 'className')
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (query.classId)
      qb.andWhere('a.class_id = :classId', { classId: query.classId });
    if (query.studentId) qb.andWhere('a.student_id = :studentId', { studentId: query.studentId });

    if (user.role === 'teacher') {
      const teacher = await this.teacherRepo.findOne({ where: { userId: user.id } });
      if (!teacher) {
        throw new ForbiddenException('教师身份异常，未绑定教师档案');
      }
      qb.andWhere('c.teacher_id = :teacherId', { teacherId: teacher.id });
    }

    const [rows, total] = await Promise.all([qb.getRawMany(), qb.getCount()]);
    return {
      items: rows.map((r) => ({
        id: Number(r.id),
        classId: r.classId ? Number(r.classId) : null,
        className: r.className ?? null,
        studentId: r.studentId ? Number(r.studentId) : null,
        studentName: r.studentName ?? null,
        studentNo: r.studentNo ?? null,
        type: r.type,
        message: r.message,
        status: r.status,
        violationCount: Number(r.violationCount ?? 0),
        periodDate: r.periodDate ?? null,
        resolvedAt: r.resolvedAt ?? null,
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async resolveAlert(id: number, user: { id: number; role: string }) {
    const row = await this.alertRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('预警不存在');
    }
    if (user.role === 'teacher') {
      const teacher = await this.teacherRepo.findOne({ where: { userId: user.id } });
      if (!teacher) {
        throw new ForbiddenException('教师身份异常，未绑定教师档案');
      }
      const owner = await this.alertRepo
        .createQueryBuilder('a')
        .leftJoin('school_class', 'c', 'c.id = a.class_id')
        .select('c.teacher_id', 'teacherId')
        .where('a.id = :id', { id })
        .getRawOne<{ teacherId: string | null }>();
      if (!owner || Number(owner.teacherId ?? 0) !== teacher.id) {
        throw new ForbiddenException('仅可处理自己班级的预警');
      }
    }
    if (row.status !== 'resolved') {
      row.status = 'resolved';
      row.resolvedAt = new Date();
      await this.alertRepo.save(row);
    }
    return {
      id: row.id,
      status: row.status,
      resolvedAt: row.resolvedAt,
    };
  }

  /** 每 10 分钟扫描一次：当天违规总次数 > 阈值则自动预警 */
  @Cron('0 */10 * * * *')
  async scanAiViolationAlerts() {
    const threshold = Number(process.env.ALERT_VIOLATION_THRESHOLD ?? 5);
    const dayKey = new Date().toISOString().slice(0, 10);
    const rows = await this.aiRecordRepo
      .createQueryBuilder('r')
      .select('r.student_id', 'studentId')
      .addSelect('MAX(r.class_id)', 'classId')
      .addSelect(
        `SUM(CASE WHEN r.violations IS NULL THEN 0 ELSE JSON_LENGTH(r.violations) END)`,
        'violationCount',
      )
      .where('DATE(r.created_at) = CURDATE()')
      .groupBy('r.student_id')
      .having('violationCount > :threshold', { threshold })
      .getRawMany<{ studentId: string; classId: string; violationCount: string }>();

    for (const r of rows) {
      const studentId = Number(r.studentId);
      const classId = Number(r.classId);
      const violationCount = Number(r.violationCount);
      const exists = await this.alertRepo.exist({
        where: {
          studentId,
          periodDate: dayKey,
          type: 'ai_violation',
        },
      });
      if (exists) continue;
      const entity = this.alertRepo.create({
        classId,
        studentId,
        type: 'ai_violation',
        message: `学生当日违规次数 ${violationCount} 次，超过阈值 ${threshold} 次`,
        status: 'open',
        violationCount,
        periodDate: dayKey,
      });
      await this.alertRepo.save(entity);
    }
  }
}
