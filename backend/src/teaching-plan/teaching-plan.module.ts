import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachingPlan } from './entities/teaching-plan.entity';
import { TeachingPlanService } from './teaching-plan.service';
import { TeachingPlanController } from './teaching-plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeachingPlan])],
  controllers: [TeachingPlanController],
  providers: [TeachingPlanService],
  exports: [TeachingPlanService],
})
export class TeachingPlanModule {}
