import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSchoolDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() principal?: string;
  @IsOptional() @IsString() logo?: string;
}
