import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateExamBatchDto {
  @IsNotEmpty() @IsNumber() planId: number;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() batchDate?: string;
  @IsOptional() @IsArray() classIds?: number[];
  @IsOptional() @IsNumber() venueId?: number;
  @IsOptional() @IsString() notes?: string;
}
