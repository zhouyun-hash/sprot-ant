import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeworkCorrection } from './entities/homework-correction.entity';
import { HomeworkReviewService } from './homework-review.service';
import { HomeworkReviewController } from './homework-review.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HomeworkCorrection])],
  controllers: [HomeworkReviewController],
  providers: [HomeworkReviewService],
  exports: [HomeworkReviewService],
})
export class HomeworkReviewModule {}
