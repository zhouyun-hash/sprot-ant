import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryHomeworkDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  /** 学生端：待完成 / 已提交 */
  @IsOptional()
  @IsIn(['pending', 'completed'])
  submissionStatus?: 'pending' | 'completed';
}
