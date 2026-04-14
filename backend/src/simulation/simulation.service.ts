import {

  BadRequestException,

  Injectable,

  UnauthorizedException,

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Score } from '../score/entities/score.entity';

import { Student } from '../student/entities/student.entity';

import { RunSimulationDto } from './dto/run-simulation.dto';



type RequestUser = { id: number; role: string };



type ProjectMeta = {

  key: string;

  label: string;

  defaultUnit: string;

  higherBetter: boolean;

  match: (project: string) => boolean;

  /** 将成绩映射为 0–100 的中考模拟得分 */

  predict: (value: number) => number;

};



function clamp(n: number, min: number, max: number) {

  return Math.max(min, Math.min(max, n));

}



const PROJECTS: ProjectMeta[] = [

  {

    key: 'rope',

    label: '跳绳',

    defaultUnit: '次',

    higherBetter: true,

    match: (p) => (p ?? '').includes('跳绳'),

    predict: (v) => clamp(Math.round((v / 200) * 100), 0, 100),

  },

  {

    key: 'situp',

    label: '仰卧起坐',

    defaultUnit: '次',

    higherBetter: true,

    match: (p) => (p ?? '').includes('仰卧'),

    predict: (v) => clamp(Math.round((v / 55) * 100), 0, 100),

  },

  {

    key: 'long_jump',

    label: '立定跳远',

    defaultUnit: '米',

    higherBetter: true,

    match: (p) => {

      const s = p ?? '';

      return s.includes('立定跳远') || s.includes('跳远');

    },

    predict: (v) => clamp(Math.round((v / 2.5) * 100), 0, 100),

  },

  {

    key: 'run_50',

    label: '50米跑',

    defaultUnit: '秒',

    higherBetter: false,

    match: (p) => {

      const s = p ?? '';

      if (s.includes('800') || s.includes('1000')) return false;

      return s.includes('50米') || /\b50\s*米/.test(s);

    },

    predict: (v) => {

      if (v <= 0) return 0;

      if (v <= 6.8) return 100;

      if (v >= 15) return clamp(Math.round(40 - (v - 15) * 2), 0, 40);

      return clamp(Math.round(100 - (v - 6.8) * 6), 20, 100);

    },

  },

  {

    key: 'run_800',

    label: '800米跑',

    defaultUnit: '秒',

    higherBetter: false,

    match: (p) => (p ?? '').includes('800'),

    predict: (v) => {

      if (v <= 0) return 0;

      const minS = 180;

      const maxS = 420;

      if (v <= minS) return 100;

      if (v >= maxS) return 20;

      return clamp(Math.round(100 - ((v - minS) / (maxS - minS)) * 80), 20, 100);

    },

  },

  {

    key: 'run_1000',

    label: '1000米跑',

    defaultUnit: '秒',

    higherBetter: false,

    match: (p) => (p ?? '').includes('1000'),

    predict: (v) => {

      if (v <= 0) return 0;

      const minS = 220;

      const maxS = 480;

      if (v <= minS) return 100;

      if (v >= maxS) return 20;

      return clamp(Math.round(100 - ((v - minS) / (maxS - minS)) * 80), 20, 100);

    },

  },

];



@Injectable()

export class SimulationService {

  constructor(

    @InjectRepository(Student)

    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Score)

    private readonly scoreRepo: Repository<Score>,

  ) {}



  getProjectCatalog() {

    return {

      items: PROJECTS.map((p) => ({

        key: p.key,

        label: p.label,

        unit: p.defaultUnit,

        higherBetter: p.higherBetter,

      })),

    };

  }



  async getHistoryBest(projectKey: string, user: RequestUser) {

    const meta = this.getMeta(projectKey);

    const student = await this.requireStudent(user);

    const scores = await this.scoreRepo.find({

      where: { studentId: student.id },

      order: { id: 'DESC' },

    });

    const matched = scores.filter((s) => meta.match(s.project));

    if (!matched.length) {

      return {

        projectKey: meta.key,

        label: meta.label,

        historicalBest: null as number | null,

        unit: meta.defaultUnit,

      };

    }

    const nums = matched

      .map((s) => Number.parseFloat(String(s.result)))

      .filter((n) => Number.isFinite(n));

    if (!nums.length) {

      return {

        projectKey: meta.key,

        label: meta.label,

        historicalBest: null as number | null,

        unit: meta.defaultUnit,

      };

    }

    const best = meta.higherBetter ? Math.max(...nums) : Math.min(...nums);

    const unit = matched[0].unit || meta.defaultUnit;

    return {

      projectKey: meta.key,

      label: meta.label,

      historicalBest: Number(best.toFixed(2)),

      unit,

    };

  }



  async run(dto: RunSimulationDto, user: RequestUser) {

    const meta = this.getMeta(dto.projectKey);

    await this.requireStudent(user);

    const hist = await this.getHistoryBest(dto.projectKey, user);

    const predictedScore = meta.predict(dto.inputValue);

    const suggestions = this.buildSuggestions(meta, dto.inputValue, predictedScore, hist.historicalBest);

    return {

      projectKey: meta.key,

      projectLabel: meta.label,

      inputValue: dto.inputValue,

      historicalBest: hist.historicalBest,

      historicalUnit: hist.unit,

      predictedScore,

      suggestions,

    };

  }



  private getMeta(key: string): ProjectMeta {

    const meta = PROJECTS.find((p) => p.key === key);

    if (!meta) {

      throw new BadRequestException('无效的项目');

    }

    return meta;

  }



  private async requireStudent(user: RequestUser) {

    if (user.role !== 'student') {

      throw new UnauthorizedException('仅学生可使用中考模拟');

    }

    const student = await this.studentRepo.findOne({ where: { userId: user.id } });

    if (!student) {

      throw new UnauthorizedException('未找到学生档案');

    }

    return student;

  }



  private buildSuggestions(

    meta: ProjectMeta,

    input: number,

    predicted: number,

    best: number | null,

  ): string {

    const parts: string[] = [];

    if (best != null) {

      const eps = 1e-6;

      if (meta.higherBetter) {

        if (input + eps < best) {

          parts.push(

            `当前输入低于历史最好成绩（${best} ${meta.defaultUnit}），建议巩固节奏与体能，逐步向个人最佳靠拢。`,

          );

        } else if (input > best + eps) {

          parts.push('若本次输入高于历史记录，请保持训练计划并注意动作规范与恢复。');

        }

      } else {

        if (input > best + eps) {

          parts.push(

            `当前输入（用时）慢于历史最好（${best} ${meta.defaultUnit}），建议加强间歇跑与配速训练。`,

          );

        } else if (input + eps < best) {

          parts.push('若本次用时优于历史记录，说明状态良好，注意赛前热身与节奏分配。');

        }

      }

    }

    if (predicted >= 85) {

      parts.push('模拟得分处于优秀区间，建议保持训练频次并关注技术细节与防伤。');

    } else if (predicted >= 70) {

      parts.push('模拟得分良好，可在薄弱环节增加专项练习以冲击更高档位。');

    } else if (predicted >= 60) {

      parts.push('模拟得分接近及格线以上，建议每周至少三次针对性训练并记录进步曲线。');

    } else {

      parts.push('模拟得分提示仍有较大提升空间，建议在教师指导下制定阶段目标并配合有氧与力量基础训练。');

    }

    return parts.length ? parts.join(' ') : '建议保持规律锻炼，循序渐进提升成绩。';

  }

}

