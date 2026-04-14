import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateAiConfigDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() category: string;
  @IsOptional() @IsObject() params?: Record<string, any>;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() description?: string;
}
