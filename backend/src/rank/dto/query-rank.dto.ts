import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class QueryRankDto {
  @IsIn(['school', 'class'])
  type: 'school' | 'class';

  @IsIn(['week', 'month'])
  period: 'week' | 'month';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId?: number;
}
