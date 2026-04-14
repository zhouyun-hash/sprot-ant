import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamBatch } from './entities/exam-batch.entity';
import { ExamBatchService } from './exam-batch.service';
import { ExamBatchController } from './exam-batch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExamBatch])],
  controllers: [ExamBatchController],
  providers: [ExamBatchService],
  exports: [ExamBatchService],
})
export class ExamBatchModule {}
