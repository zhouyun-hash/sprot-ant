import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacherId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  subject?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  period: number;

  @IsNotEmpty()
  @IsString()
  @Length(1, 8)
  startTime: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 8)
  endTime: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  venueId?: number;

  @IsNotEmpty()
  @IsString()
  @Length(1, 16)
  schoolYear: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  semester?: number;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  status?: string;
}
