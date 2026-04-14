import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateAiResultDto {
  @IsString()
  @Length(1, 64)
  sessionId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  count: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  violations?: string[];
}
