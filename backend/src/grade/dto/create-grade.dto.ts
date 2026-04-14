import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGradeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsNotEmpty()
  @IsString()
  schoolYear: string;

  /** 所属学校 ID（必填） */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  schoolId: number;
}
