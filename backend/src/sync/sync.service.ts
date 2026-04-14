import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Repository } from 'typeorm';
import { Score } from '../score/entities/score.entity';
import { SyncLog } from './entities/sync-log.entity';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(SyncLog)
    private readonly syncLogRepo: Repository<SyncLog>,
  ) {}

  async getLogs(page = 1, pageSize = 20) {
    const [rows, total] = await this.syncLogRepo.findAndCount({
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows, total, page, pageSize };
  }

  /** 每天凌晨 2 点执行 */
  @Cron('0 0 2 * * *')
  async nightlySyncJob() {
    await this.runSync('cron');
  }

  async triggerManualSync() {
    return this.runSync('manual');
  }

  async getExternalAssetSummary() {
    const url = this.config.get<string>('EXTERNAL_ASSET_SUMMARY_URL', '');
    const token = this.config.get<string>('EXTERNAL_ASSET_TOKEN', '');
    if (!url) {
      return {
        ok: false,
        message: '未配置 EXTERNAL_ASSET_SUMMARY_URL',
        data: null,
      };
    }
    const res = await axios.get(url, {
      timeout: Number(this.config.get<string>('EXTERNAL_API_TIMEOUT_MS', '10000')),
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return {
      ok: true,
      source: 'asset-system',
      data: res.data,
    };
  }

  async getExternalSafetyEvents() {
    const url = this.config.get<string>('EXTERNAL_SAFETY_EVENTS_URL', '');
    const token = this.config.get<string>('EXTERNAL_SAFETY_TOKEN', '');
    if (!url) {
      return {
        ok: false,
        message: '未配置 EXTERNAL_SAFETY_EVENTS_URL',
        data: null,
      };
    }
    const res = await axios.get(url, {
      timeout: Number(this.config.get<string>('EXTERNAL_API_TIMEOUT_MS', '10000')),
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return {
      ok: true,
      source: 'campus-safety-ai',
      data: res.data,
    };
  }

  private async runSync(source: 'cron' | 'manual') {
    const pending = await this.scoreRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.task', 't')
      .innerJoinAndSelect('s.student', 'st')
      .where('s.sync_status = 0')
      .andWhere("t.status = 'finished'")
      .orderBy('s.id', 'ASC')
      .getMany();

    if (!pending.length) {
      return { source, synced: 0, failed: 0, message: '无待上报数据' };
    }

    const payload = {
      source,
      bizDate: new Date().toISOString().slice(0, 10),
      records: pending.map((s) => ({
        scoreId: s.id,
        taskId: s.taskId,
        taskName: s.task?.name ?? null,
        studentId: s.studentId,
        classId: s.student?.classId ?? null,
        project: s.project,
        result: s.result,
        unit: s.unit,
        reviewStatus: s.reviewStatus,
        reviewRemark: s.reviewRemark,
        createdAt: s.createdAt,
      })),
    };

    const url = this.config.get<string>('EDU_SYNC_URL', '');
    const token = this.config.get<string>('EDU_SYNC_TOKEN', '');
    const retryTimes = 3;
    let success = false;
    let responseText = '';
    let errorMessage = '';

    for (let i = 1; i <= retryTimes; i++) {
      try {
        if (!url) {
          throw new Error('未配置 EDU_SYNC_URL');
        }
        const res = await axios.post(url, payload, {
          timeout: Number(this.config.get<string>('EDU_SYNC_TIMEOUT_MS', '15000')),
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        responseText = stringifySafe(res.data);
        if (res.status >= 200 && res.status < 300) {
          success = true;
          break;
        }
        errorMessage = `HTTP ${res.status}`;
      } catch (e) {
        errorMessage = (e as Error).message;
        this.logger.warn(`成绩上报失败，第 ${i} 次重试: ${errorMessage}`);
      }
    }

    if (success) {
      const now = new Date();
      for (const s of pending) {
        s.syncStatus = 1;
        s.syncedAt = now;
      }
      await this.scoreRepo.save(pending);
      await this.syncLogRepo.save(
        this.syncLogRepo.create({
          target: 'education_bureau',
          status: 'success',
          recordCount: pending.length,
          requestBody: stringifySafe(payload),
          responseBody: responseText || null,
          errorMessage: null,
        }),
      );
      return { source, synced: pending.length, failed: 0 };
    }

    for (const s of pending) {
      s.syncRetryCount = (s.syncRetryCount ?? 0) + retryTimes;
      s.syncStatus = 2;
    }
    await this.scoreRepo.save(pending);
    await this.syncLogRepo.save(
      this.syncLogRepo.create({
        target: 'education_bureau',
        status: 'failed',
        recordCount: pending.length,
        requestBody: stringifySafe(payload),
        responseBody: responseText || null,
        errorMessage,
      }),
    );
    return { source, synced: 0, failed: pending.length, error: errorMessage };
  }
}

function stringifySafe(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
