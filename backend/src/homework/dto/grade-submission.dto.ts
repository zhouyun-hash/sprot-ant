import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class GradeSubmissionDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  teacherScore: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  comment?: string;
}
