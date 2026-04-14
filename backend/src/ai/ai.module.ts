import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Score } from '../score/entities/score.entity';
import { Student } from '../student/entities/student.entity';
import { Task } from '../task/entities/task.entity';
import { ApiAiController } from './api-ai.controller';
import { AiController } from './ai.controller';
import { TrainingRecordController } from './training-record.controller';
import { AiGateway } from './ai.gateway';
import { AiService } from './ai.service';
import { AiRecord } from './entities/ai-record.entity';
import { AiSession } from './entities/ai-session.entity';
import { TrainingRecord } from './entities/training-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiSession,
      AiRecord,
      TrainingRecord,
      Task,
      Student,
      Score,
    ]),
    AuthModule,
  ],
  controllers: [AiController, ApiAiController, TrainingRecordController],
  providers: [AiService, AiGateway],
  exports: [AiService],
})
export class AiModule {}
