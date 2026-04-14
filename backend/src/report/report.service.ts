import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from '../score/entities/score.entity';
import { Student } from '../student/entities/student.entity';
import { Report } from './entities/report.entity';

const DIMENSIONS = ['力量', '速度', '耐力', '柔韧', '协调'] as const;
type Dimension = (typeof DIMENSIONS)[number];

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
  ) {}

  async getOrGenerateStudentReport(studentId: number) {
    const exists = await this.studentRepo.exist({ where: { id: studentId } });
    if (!exists) {
      throw new NotFoundException('学生不存在');
    }
    const latest = await this.reportRepo.findOne({
      where: { studentId },
      order: { generatedAt: 'DESC', id: 'DESC' },
    });
    if (latest) {
      return this.serializeReport(latest);
    }
    return this.generateStudentReport(studentId);
  }

  async getStudentReportHistory(studentId: number, page = 1, pageSize = 10) {
    const exists = await this.studentRepo.exist({ where: { id: studentId } });
    if (!exists) {
      throw new NotFoundException('学生不存在');
    }
    const [rows, total] = await this.reportRepo.findAndCount({
      where: { studentId },
      order: { generatedAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: rows.map((r) => this.serializeReport(r)),
      total,
      page,
      pageSize,
    };
  }

  async getStudentReportById(studentId: number, reportId: number) {
    const exists = await this.studentRepo.exist({ where: { id: studentId } });
    if (!exists) {
      throw new NotFoundException('学生不存在');
    }
    const row = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!row || row.studentId !== studentId) {
      throw new NotFoundException('报告不存在');
    }
    return this.serializeReport(row);
  }

  async generateAllReports() {
    const students = await this.studentRepo.find({ select: { id: true } });
    let success = 0;
    const errors: Array<{ studentId: number; reason: string }> = [];
    for (const s of students) {
      try {
        await this.generateStudentReport(s.id);
        success++;
      } catch (e) {
        errors.push({ studentId: s.id, reason: (e as Error).message });
      }
    }
    return {
      total: students.length,
      success,
      failed: students.length - success,
      errors,
    };
  }

  private async generateStudentReport(studentId: number) {
    const scores = await this.scoreRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
    const grouped: Record<Dimension, number[]> = {
      力量: [],
      速度: [],
      耐力: [],
      柔韧: [],
      协调: [],
    };

    for (const s of scores) {
      const dim = mapProjectToDimension(s.project);
      if (!dim) continue;
      const v = Number(s.result);
      if (Number.isFinite(v)) {
        grouped[dim].push(v);
      }
    }

    const dimensionScores: Record<string, number> = {};
    const radarData: Record<string, number> = {};
    for (const d of DIMENSIONS) {
      const list = grouped[d];
      const avg = list.length
        ? list.reduce((a, b) => a + b, 0) / list.length
        : 0;
      dimensionScores[d] = Number(avg.toFixed(2));
      radarData[d] = Number(avg.toFixed(2));
    }

    const suggestions = buildSuggestions(dimensionScores);
    const entity = this.reportRepo.create({
      studentId,
      radarData,
      dimensionScores,
      suggestions,
    });
    const saved = await this.reportRepo.save(entity);
    return this.serializeReport(saved);
  }

  private serializeReport(saved: Report) {
    return {
      id: saved.id,
      studentId: saved.studentId,
      radarData: saved.radarData,
      dimensionScores: saved.dimensionScores,
      suggestions: saved.suggestions,
      generatedAt: saved.generatedAt,
      updatedAt: saved.updatedAt,
    };
  }
}

function mapProjectToDimension(project: string): Dimension | null {
  const p = (project ?? '').trim();
  if (!p) return null;
  if (p.includes('跳远') || p.includes('引体') || p.includes('仰卧起坐') || p.includes('立定')) {
    return '力量';
  }
  if (p.includes('跑') && (p.includes('短') || p.includes('50') || p.includes('100'))) {
    return '速度';
  }
  if (p.includes('长跑') || p.includes('耐力') || p.includes('800') || p.includes('1000')) {
    return '耐力';
  }
  if (p.includes('坐位体前屈') || p.includes('柔韧')) {
    return '柔韧';
  }
  if (p.includes('跳绳') || p.includes('协调')) {
    return '协调';
  }
  return '协调';
}

function buildSuggestions(dimensionScores: Record<string, number>): string {
  const weak = Object.entries(dimensionScores)
    .filter(([, v]) => v < 60)
    .map(([k]) => k);
  if (!weak.length) {
    return '各维度表现较均衡，建议保持规律训练并逐步提高训练强度。';
  }
  return `建议重点提升${weak.join('、')}维度：每周至少3次专项训练，结合拉伸与恢复，循序渐进提高成绩。`;
}
