import { IsNotEmpty, IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

export class CreateExamStandardDto {
  @IsNotEmpty() @IsNumber() projectId: number;
  @IsNotEmpty() @IsString() gender: string;
  @IsOptional() @IsNumber() ageMin?: number;
  @IsOptional() @IsNumber() ageMax?: number;
  @IsOptional() @IsString() gradeLevel?: string;
  @IsOptional() @IsObject() scoreRules?: Record<string, any>;
  @IsOptional() @IsString() version?: string;
}
