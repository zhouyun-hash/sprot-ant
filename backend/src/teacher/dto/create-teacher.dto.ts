import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateTeacherDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  teacherNo: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  subject?: string;

  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone?: string;
}
