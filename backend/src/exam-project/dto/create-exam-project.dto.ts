import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ExamProjectScoreType,
  normalizeExamProjectScoreType,
} from '../constants/exam-project-score-type';

export class CreateExamProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  /** 计分方式：time / count / distance（兼容旧版中文：计时/计数/计距） */
  @IsOptional()
  @Transform(({ value }) => normalizeExamProjectScoreType(value))
  @IsEnum(ExamProjectScoreType)
  scoreType?: ExamProjectScoreType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
