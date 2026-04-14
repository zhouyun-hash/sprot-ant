import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamPlan } from './entities/exam-plan.entity';
import { ExamPlanService } from './exam-plan.service';
import { ExamPlanController } from './exam-plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExamPlan])],
  controllers: [ExamPlanController],
  providers: [ExamPlanService],
  exports: [ExamPlanService],
})
export class ExamPlanModule {}
