import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async check() {
    let mysql = false;
    try {
      await this.dataSource.query('SELECT 1');
      mysql = true;
    } catch {
      mysql = false;
    }
    let redis = false;
    try {
      const pong = await this.redisService.ping();
      redis = pong === 'PONG';
    } catch {
      redis = false;
    }
    return { ok: mysql && redis, mysql, redis };
  }
}
