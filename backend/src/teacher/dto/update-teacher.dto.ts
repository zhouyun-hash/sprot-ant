import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateTeacherDto {
  /** 仅集团级管理员可调整教师所属学校 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  teacherNo?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  subject?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone?: string | null;
}
