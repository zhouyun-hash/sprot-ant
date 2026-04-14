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

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  studentNo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的家长手机号' })
  parentPhone?: string | null;

  @IsOptional()
  @IsString()
  @Length(6, 32)
  idCard?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gender?: number | null;
}
