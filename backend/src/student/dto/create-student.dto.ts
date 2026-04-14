import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  studentNo: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId: number;

  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的家长手机号' })
  parentPhone?: string;

  @IsOptional()
  @IsString()
  @Length(6, 32)
  idCard?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gender?: number;
}
