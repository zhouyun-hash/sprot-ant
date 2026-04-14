import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateRankRulesDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  trainingWeight: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  scoreWeight: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  scoreCountWeight: number;
}
