import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateHomeworkCorrectionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  submissionId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reviewerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aiScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  manualScore?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['ai', 'manual', 'mixed'])
  correctionType: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  status?: string;
}
