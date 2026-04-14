import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TrainingRecord } from '../ai/entities/training-record.entity';
import { SchoolClass } from '../class/entities/school-class.entity';
import { Score } from '../score/entities/score.entity';
import { Student } from '../student/entities/student.entity';
import { RankController } from './rank.controller';
import { RankService } from './rank.service';
import { SchoolConfigController } from './school-config.controller';
import { SchoolConfig } from './entities/school-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      SchoolClass,
      Score,
      TrainingRecord,
      SchoolConfig,
    ]),
    AuthModule,
  ],
  controllers: [RankController, SchoolConfigController],
  providers: [RankService],
  exports: [RankService],
})
export class RankModule {}
