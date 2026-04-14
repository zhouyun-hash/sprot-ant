import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ReviewStatus } from '../entities/score.entity';

export class ReviewScoreDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @IsIn(['pending', 'approved', 'rejected'])
  reviewStatus: ReviewStatus;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  reviewRemark?: string;
}
