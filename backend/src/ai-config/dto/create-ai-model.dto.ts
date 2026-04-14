import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAiModelDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() type: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsNotEmpty() @IsString() version: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsNumber() accuracy?: number;
}
