import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Score } from '../score/entities/score.entity';
import { Student } from '../student/entities/student.entity';
import { Task } from '../task/entities/task.entity';
import { CreateAiResultDto } from './dto/create-ai-result.dto';
import { CreateAiSessionDto } from './dto/create-ai-session.dto';
import { CreateTrainingRecordDto } from './dto/create-training-record.dto';
import { SelfTrainingDto } from './dto/self-training.dto';
import { AiGateway } from './ai.gateway';
import { AiRecord } from './entities/ai-record.entity';
import { AiSession } from './entities/ai-session.entity';
import { TrainingRecord } from './entities/training-record.entity';

@Injectable()
export class AiService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AiSession)
    private readonly sessionRepo: Repository<AiSession>,
    @InjectRepository(AiRecord)
    private readonly recordRepo: Repository<AiRecord>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(TrainingRecord)
    private readonly trainingRecordRepo: Repository<TrainingRecord>,
    private readonly aiGateway: AiGateway,
  ) {}

  async createSession(dto: CreateAiSessionDto) {
    const task = await this.taskRepo.findOne({ where: { id: dto.taskId } });
    if (!task) {
      throw new BadRequestException('任务不存在');
    }
    const sessionId = `sess_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const entity = this.sessionRepo.create({
      sessionId,
      taskId: dto.taskId,
      classId: dto.classId,
      project: dto.project,
      status: 'running',
      endedAt: null,
    });
    const saved = await this.sessionRepo.save(entity);
    return {
      sessionId: saved.sessionId,
      status: saved.status,
      taskId: saved.taskId,
      classId: saved.classId,
      project: saved.project,
      createdAt: saved.createdAt,
    };
  }

  async createResult(dto: CreateAiResultDto) {
    const session = await this.sessionRepo.findOne({
      where: { sessionId: dto.sessionId },
    });
    if (!session) {
      throw new NotFoundException('会话不存在');
    }
    if (session.status !== 'running') {
      throw new BadRequestException('会话已结束，无法继续写入结果');
    }
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new BadRequestException('学生不存在');
    }
    if (student.classId !== session.classId) {
      throw new BadRequestException('学生不属于该会话班级');
    }

    const record = this.recordRepo.create({
      sessionId: session.sessionId,
      taskId: session.taskId,
      classId: session.classId,
      studentId: dto.studentId,
      count: dto.count,
      violations: dto.violations ?? [],
    });
    const savedRecord = await this.recordRepo.save(record);

    let score = await this.scoreRepo.findOne({
      where: {
        taskId: session.taskId,
        studentId: dto.studentId,
        project: session.project,
      },
    });
    if (!score) {
      score = this.scoreRepo.create({
        taskId: session.taskId,
        studentId: dto.studentId,
        project: session.project,
        result: String(dto.count),
        unit: '次',
        reviewStatus: 'pending',
        reviewRemark:
          dto.violations && dto.violations.length
            ? dto.violations.join('；')
            : null,
      });
    } else {
      score.result = String(dto.count);
      score.reviewRemark =
        dto.violations && dto.violations.length
          ? dto.violations.join('；')
          : null;
    }
    const savedScore = await this.scoreRepo.save(score);

    const payload = {
      recordId: savedRecord.id,
      sessionId: savedRecord.sessionId,
      studentId: savedRecord.studentId,
      count: savedRecord.count,
      violations: savedRecord.violations ?? [],
      scoreId: savedScore.id,
      updatedScore: {
        id: savedScore.id,
        taskId: savedScore.taskId,
        studentId: savedScore.studentId,
        project: savedScore.project,
        result: savedScore.result,
        unit: savedScore.unit,
      },
    };
    this.aiGateway.emitSessionResult(savedRecord.sessionId, payload);
    return payload;
  }

  async getSessionStatus(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { sessionId } });
    if (!session) {
      throw new NotFoundException('会话不存在');
    }
    return {
      sessionId: session.sessionId,
      taskId: session.taskId,
      classId: session.classId,
      project: session.project,
      status: session.status,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
    };
  }

  async endSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { sessionId } });
    if (!session) {
      throw new NotFoundException('会话不存在');
    }
    if (session.status === 'ended') {
      return { sessionId, status: session.status, endedAt: session.endedAt };
    }
    session.status = 'ended';
    session.endedAt = new Date();
    await this.sessionRepo.save(session);
    return { sessionId: session.sessionId, status: session.status, endedAt: session.endedAt };
  }

  async selfTraining(
    dto: SelfTrainingDto,
    user: { id: number; role: string; username: string },
  ) {
    const baseUrl = this.config.get<string>(
      'AI_PLATFORM_BASE_URL',
      'http://127.0.0.1:8000',
    );
    const result = await this.callSelfTrainingApi(baseUrl, dto);

    let studentId: number | null = null;
    let trainingRecorded = false;
    if (user.role === 'student') {
      const student = await this.studentRepo.findOne({ where: { userId: user.id } });
      studentId = student?.id ?? null;
      const shouldPersist = dto.persist !== false;
      if (shouldPersist) {
        await this.trainingRecordRepo.save(
          this.trainingRecordRepo.create({
            userId: user.id,
            studentId,
            project: dto.project,
            resultJson: result as Record<string, unknown>,
          }),
        );
        trainingRecorded = true;
      }
    }

    return {
      project: dto.project,
      result,
      trainingRecorded,
      studentId,
    };
  }

  /**
   * 训练结束后显式保存一条训练记录（学生端）。
   */
  async createTrainingRecord(
    dto: CreateTrainingRecordDto,
    user: { id: number; role: string },
  ) {
    if (user.role !== 'student') {
      throw new ForbiddenException('仅学生可保存训练记录');
    }
    const student = await this.studentRepo.findOne({ where: { userId: user.id } });
    if (!student) {
      throw new NotFoundException('未找到学生档案');
    }
    const row = await this.trainingRecordRepo.save(
      this.trainingRecordRepo.create({
        userId: user.id,
        studentId: student.id,
        project: dto.project,
        resultJson: dto.resultJson,
      }),
    );
    return {
      id: row.id,
      project: row.project,
      createdAt: row.createdAt,
    };
  }

  private async callSelfTrainingApi(baseUrl: string, dto: SelfTrainingDto) {
    const base = baseUrl.replace(/\/+$/, '');
    const timeout = 15000;
    try {
      if (dto.project === '跳绳') {
        const res = await axios.post(
          `${base}/api/ai/skipping`,
          { image_base64: dto.imageBase64, session_id: `self-${Date.now()}`, reset: false },
          { timeout },
        );
        return res.data;
      }
      if (dto.project === '仰卧起坐') {
        const res = await axios.post(
          `${base}/api/ai/situp`,
          { image_base64: dto.imageBase64, session_id: `self-${Date.now()}`, reset: false },
          { timeout },
        );
        return res.data;
      }
      if (dto.project === '立定跳远' || dto.project === '跑步') {
        const res = await axios.post(
          `${base}/api/ai/vision/pose`,
          { image_base64: dto.imageBase64 },
          { timeout },
        );
        return res.data;
      }
      throw new BadRequestException('不支持的训练项目');
    } catch (e) {
      throw new BadRequestException(`调用 AI 自主训练接口失败: ${(e as Error).message}`);
    }
  }
}
