import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolClass } from '../class/entities/school-class.entity';
import { Student } from '../student/entities/student.entity';
import { QueryRankDto } from './dto/query-rank.dto';
import { UpdateRankRulesDto } from './dto/update-rank-rules.dto';
import { SchoolConfig } from './entities/school-config.entity';

type RankRules = {
  trainingWeight: number;
  scoreWeight: number;
  scoreCountWeight: number;
};
const RANK_RULES_KEY = 'rank_rules';

@Injectable()
export class RankService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(SchoolClass)
    private readonly classRepo: Repository<SchoolClass>,
    @InjectRepository(SchoolConfig)
    private readonly configRepo: Repository<SchoolConfig>,
  ) {}

  async getRank(query: QueryRankDto) {
    if (query.type === 'class' && !query.classId) {
      throw new BadRequestException('type=class 时必须传 classId');
    }
    if (query.type === 'class') {
      const cls = await this.classRepo.findOne({ where: { id: query.classId! } });
      if (!cls) throw new NotFoundException('班级不存在');
    }

    const rules = await this.getRankRules();
    const sinceDays = query.period === 'week' ? 7 : 30;
    const classFilterSql = query.type === 'class' ? 'AND st.class_id = ?' : '';
    const params: Array<number> = [sinceDays, sinceDays];
    if (query.type === 'class') {
      params.push(query.classId!);
    }
    const sql = `
      SELECT
        st.id AS studentId,
        u.name AS studentName,
        u.avatar AS avatar,
        st.student_no AS studentNo,
        c.id AS classId,
        c.name AS className,
        IFNULL(sa.avgScore, 0) AS avgScore,
        IFNULL(sa.scoreCount, 0) AS scoreCount,
        IFNULL(ta.trainingCount, 0) AS trainingCount,
        (
          IFNULL(sa.avgScore, 0) * ${rules.scoreWeight}
          + IFNULL(ta.trainingCount, 0) * ${rules.trainingWeight}
          + IFNULL(sa.scoreCount, 0) * ${rules.scoreCountWeight}
        ) AS points
      FROM student st
      INNER JOIN user u ON u.id = st.user_id
      INNER JOIN school_class c ON c.id = st.class_id
      LEFT JOIN (
        SELECT
          s.student_id AS studentId,
          AVG(CAST(s.result AS DECIMAL(10,2))) AS avgScore,
          COUNT(1) AS scoreCount
        FROM score s
        WHERE s.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY s.student_id
      ) sa ON sa.studentId = st.id
      LEFT JOIN (
        SELECT
          t.student_id AS studentId,
          COUNT(1) AS trainingCount
        FROM training_record t
        WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY t.student_id
      ) ta ON ta.studentId = st.id
      WHERE 1=1
      ${classFilterSql}
      ORDER BY points DESC, st.id ASC
      LIMIT 200
    `;

    const rows = (await this.studentRepo.manager.query(sql, params)) as Array<{
      studentId: string;
      studentName: string;
      avatar: string | null;
      studentNo: string;
      classId: string;
      className: string;
      avgScore: string;
      scoreCount: string;
      trainingCount: string;
      points: string;
    }>;

    return {
      type: query.type,
      period: query.period,
      classId: query.classId ?? null,
      rules,
      items: rows.map((r: any, idx: number) => ({
        rank: idx + 1,
        studentId: Number(r.studentId),
        studentName: r.studentName,
        avatar: r.avatar ?? null,
        studentNo: r.studentNo,
        classId: Number(r.classId),
        className: r.className,
        avgScore: Number(Number(r.avgScore).toFixed(2)),
        scoreCount: Number(r.scoreCount),
        trainingCount: Number(r.trainingCount),
        points: Number(Number(r.points).toFixed(2)),
      })),
    };
  }

  async getRankRulesConfig() {
    const row = await this.configRepo.findOne({ where: { configKey: RANK_RULES_KEY } });
    const defaults: RankRules = {
      trainingWeight: 3,
      scoreWeight: 1,
      scoreCountWeight: 0.5,
    };
    const cfg = row?.configJson ?? {};
    return {
      trainingWeight: this.pickPositive(cfg.trainingWeight, defaults.trainingWeight),
      scoreWeight: this.pickPositive(cfg.scoreWeight, defaults.scoreWeight),
      scoreCountWeight: this.pickPositive(
        cfg.scoreCountWeight,
        defaults.scoreCountWeight,
      ),
      source: row ? 'db' : 'default',
    };
  }

  async updateRankRulesConfig(dto: UpdateRankRulesDto) {
    let row = await this.configRepo.findOne({ where: { configKey: RANK_RULES_KEY } });
    const payload = {
      trainingWeight: dto.trainingWeight,
      scoreWeight: dto.scoreWeight,
      scoreCountWeight: dto.scoreCountWeight,
    };
    if (!row) {
      row = this.configRepo.create({
        configKey: RANK_RULES_KEY,
        configJson: payload,
      });
    } else {
      row.configJson = payload;
    }
    const saved = await this.configRepo.save(row);
    return {
      id: saved.id,
      configKey: saved.configKey,
      configJson: saved.configJson,
      updatedAt: saved.updatedAt,
    };
  }

  private async getRankRules(): Promise<RankRules> {
    const defaults: RankRules = {
      trainingWeight: 3,
      scoreWeight: 1,
      scoreCountWeight: 0.5,
    };
    const row = await this.configRepo.findOne({ where: { configKey: RANK_RULES_KEY } });
    const cfg = row?.configJson ?? {};
    const trainingWeight = this.pickPositive(cfg.trainingWeight, defaults.trainingWeight);
    const scoreWeight = this.pickPositive(cfg.scoreWeight, defaults.scoreWeight);
    const scoreCountWeight = this.pickPositive(
      cfg.scoreCountWeight,
      defaults.scoreCountWeight,
    );
    return { trainingWeight, scoreWeight, scoreCountWeight };
  }

  private pickPositive(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
}
