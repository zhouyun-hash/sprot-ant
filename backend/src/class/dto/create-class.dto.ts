import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateClassDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  gradeId: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  classNo: string;

  // 兼容历史入参；当前以 gradeId 为准，grade 文本由服务端根据年级回填
  @IsOptional()
  @IsString()
  @Length(1, 32)
  grade?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  schoolYear: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  headTeacherId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  peTeacherId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherId?: number;
}
