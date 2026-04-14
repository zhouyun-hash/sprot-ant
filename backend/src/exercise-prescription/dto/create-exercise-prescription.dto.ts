import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateExercisePrescriptionDto {
  @IsNotEmpty() @IsNumber() studentId: number;
  @IsNotEmpty() @IsString() title: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsArray() exercises?: Record<string, any>[];
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsNumber() durationDays?: number;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
}
