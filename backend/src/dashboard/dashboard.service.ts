import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from '../score/entities/score.entity';

@Injectable()
export class DashboardService {
  private readonly passScore: number;
  private readonly excellentScore: number;
  private readonly basePoints: number;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
  ) {
    this.passScore = this.readPositiveNumber('DASHBOARD_PASS_SCORE', 60);
    this.excellentScore = this.readPositiveNumber(
      'DASHBOARD_EXCELLENT_SCORE',
      85,
    );
    this.basePoints = this.readPositiveNumber('DASHBOARD_BASE_POINTS', 5);
  }

  async getOverview() {
    const row = await this.scoreRepo
      .createQueryBuilder('s')
      .select('COUNT(1)', 'total')
      .addSelect(
        `SUM(CASE WHEN CAST(s.result AS DECIMAL(10,2)) >= ${this.passScore} THEN 1 ELSE 0 END)`,
        'passCnt',
      )
      .addSelect(
        `SUM(CASE WHEN CAST(s.result AS DECIMAL(10,2)) >= ${this.excellentScore} THEN 1 ELSE 0 END)`,
        'excellentCnt',
      )
      .addSelect('COUNT(DISTINCT s.student_id)', 'studentCnt')
      .addSelect(
        `AVG(CASE
          WHEN s.unit LIKE '%分%' THEN CAST(s.result AS DECIMAL(10,2))
          WHEN s.unit LIKE '%秒%' THEN CAST(s.result AS DECIMAL(10,2)) / 60
          ELSE CAST(s.result AS DECIMAL(10,2)) / 100
        END)`,
        'avgMinutes',
      )
      .getRawOne<{
        total: string;
        passCnt: string;
        excellentCnt: string;
        studentCnt: string;
        avgMinutes: string | null;
      }>();

    const total = Number(row?.total ?? 0);
    const passCnt = Number(row?.passCnt ?? 0);
    const excellentCnt = Number(row?.excellentCnt ?? 0);
    return {
      passRate: total ? Number((passCnt / total).toFixed(4)) : 0,
      excellentRate: total ? Number((excellentCnt / total).toFixed(4)) : 0,
      avgExerciseMinutes:
        row?.avgMinutes != null ? Number(Number(row.avgMinutes).toFixed(2)) : 0,
      totalScores: total,
      totalStudents: Number(row?.studentCnt ?? 0),
    };
  }

  async getGradeCompare() {
    const rows = await this.scoreRepo
      .createQueryBuilder('s')
      .innerJoin('student', 'st', 'st.id = s.student_id')
      .innerJoin('school_class', 'c', 'c.id = st.class_id')
      .select('c.grade', 'grade')
      .addSelect('s.project', 'project')
      .addSelect('AVG(CAST(s.result AS DECIMAL(10,2)))', 'avgScore')
      .groupBy('c.grade')
      .addGroupBy('s.project')
      .orderBy('c.grade', 'ASC')
      .addOrderBy('s.project', 'ASC')
      .getRawMany<{ grade: string; project: string; avgScore: string }>();

    return rows.map((r) => ({
      grade: r.grade,
      project: r.project,
      avgScore: Number(Number(r.avgScore).toFixed(2)),
    }));
  }

  async getProjectTrend() {
    const rows = await this.scoreRepo
      .createQueryBuilder('s')
      .select("DATE_FORMAT(s.created_at, '%Y-%m')", 'month')
      .addSelect('s.project', 'project')
      .addSelect('AVG(CAST(s.result AS DECIMAL(10,2)))', 'avgScore')
      .where('s.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)')
      .groupBy("DATE_FORMAT(s.created_at, '%Y-%m')")
      .addGroupBy('s.project')
      .orderBy('month', 'ASC')
      .addOrderBy('s.project', 'ASC')
      .getRawMany<{ month: string; project: string; avgScore: string }>();

    return rows.map((r) => ({
      month: r.month,
      project: r.project,
      avgScore: Number(Number(r.avgScore).toFixed(2)),
    }));
  }

  async getTopStudents(pointFactor = 1) {
    const factor = Number.isFinite(pointFactor) && pointFactor > 0 ? pointFactor : 1;
    const rows = await this.scoreRepo
      .createQueryBuilder('s')
      .innerJoin('student', 'st', 'st.id = s.student_id')
      .innerJoin('user', 'u', 'u.id = st.user_id')
      .select('s.student_id', 'studentId')
      .addSelect('u.name', 'studentName')
      .addSelect('st.student_no', 'studentNo')
      .addSelect('AVG(CAST(s.result AS DECIMAL(10,2)))', 'avgScore')
      .addSelect('COUNT(1)', 'scoreCount')
      .addSelect(
        `SUM(CAST(s.result AS DECIMAL(10,2)) * ${factor}) + COUNT(1) * ${this.basePoints}`,
        'points',
      )
      .groupBy('s.student_id')
      .addGroupBy('u.name')
      .addGroupBy('st.student_no')
      .orderBy('points', 'DESC')
      .limit(10)
      .getRawMany<{
        studentId: string;
        studentName: string;
        studentNo: string;
        avgScore: string;
        scoreCount: string;
        points: string;
      }>();

    return rows.map((r, idx) => ({
      rank: idx + 1,
      studentId: Number(r.studentId),
      studentName: r.studentName,
      studentNo: r.studentNo,
      avgScore: Number(Number(r.avgScore).toFixed(2)),
      scoreCount: Number(r.scoreCount),
      points: Number(Number(r.points).toFixed(2)),
    }));
  }

  private readPositiveNumber(key: string, fallback: number): number {
    const raw = this.config.get<string>(key);
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
}
