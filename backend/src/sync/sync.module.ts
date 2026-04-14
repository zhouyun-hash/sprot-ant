import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Score } from '../score/entities/score.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncLog } from './entities/sync-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Score, SyncLog]), AuthModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
