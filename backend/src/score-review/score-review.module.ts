import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoreReview } from './entities/score-review.entity';
import { ScoreReviewService } from './score-review.service';
import { ScoreReviewController } from './score-review.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ScoreReview])],
  controllers: [ScoreReviewController],
  providers: [ScoreReviewService],
  exports: [ScoreReviewService],
})
export class ScoreReviewModule {}
