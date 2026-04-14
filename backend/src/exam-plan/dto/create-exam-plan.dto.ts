import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateExamPlanDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() schoolYear: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsArray() projectIds?: number[];
  @IsOptional() @IsArray() gradeIds?: number[];
  @IsOptional() @IsString() description?: string;
}
